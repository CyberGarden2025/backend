import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

type KeycloakUser = {
    id: string;
    email?: string;
    username?: string;
    attributes?: Record<string, string[]>;
};

export type KeycloakUserProfile = {
    id: string;
    email: string;
    username: string;
    balance: number;
    financialCushion?: number;
    transactionLimit?: number;
    categoryLimits: Record<string, number>;
    notificationSettings: {
        categoryLimitWarning: boolean;
        financialCushionWarning: boolean;
        anomalousTransactionAlert: boolean;
        monthlyReport: boolean;
    };
    fcmToken?: string;
};

@Injectable()
export class KeycloakUserService {
    private readonly logger = new Logger(KeycloakUserService.name);
    private readonly http: AxiosInstance;
    private adminTokenCache: { token: string; exp: number } | null = null;

    constructor(private readonly configService: ConfigService) {
        const internalUrl =
            this.configService.get<string>('KEYCLOAK_INTERNAL_URL') ||
            this.configService.get<string>('KEYCLOAK_AUTH_SERVER_URL');
        this.http = axios.create({
            baseURL: internalUrl,
            timeout: 10000,
        });
    }

    private async getAdminToken(): Promise<string> {
        const now = Date.now();
        if (this.adminTokenCache && this.adminTokenCache.exp > now + 5000) {
            return this.adminTokenCache.token;
        }

        const username = this.configService.get<string>('KEYCLOAK_ADMIN_USER') || 'admin';
        const password = this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD') || 'admin';
        const tokenBase =
            this.configService.get<string>('KEYCLOAK_INTERNAL_URL') ||
            this.configService.get<string>('KEYCLOAK_AUTH_SERVER_URL');
        const tokenUrl = `${tokenBase}/realms/master/protocol/openid-connect/token`;

        try {
            const params = new URLSearchParams();
            params.set('grant_type', 'password');
            params.set('client_id', 'admin-cli');
            params.set('username', username);
            params.set('password', password);

            const resp = await axios.post(tokenUrl, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const token = resp.data.access_token as string;
            const expiresIn = resp.data.expires_in as number;
            this.adminTokenCache = {
                token,
                exp: now + (expiresIn - 30) * 1000,
            };
            return token;
        } catch (error) {
            this.logger.error(`Failed to obtain admin token: ${error}`);
            throw new UnauthorizedException('Cannot obtain Keycloak admin token');
        }
    }

    private async kcRequest<T>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, data?: any) {
        const token = await this.getAdminToken();
        return this.http.request<T>({
            method,
            url,
            data,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async findById(id: string): Promise<KeycloakUserProfile> {
        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'dev');
        const resp = await this.kcRequest<KeycloakUser>('get', `/admin/realms/${realm}/users/${id}`);
        return this.toProfile(resp.data);
    }

    async findByEmail(email: string): Promise<KeycloakUserProfile | null> {
        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'dev');
        const resp = await this.kcRequest<KeycloakUser[]>(
            'get',
            `/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`,
        );
        if (!resp.data || resp.data.length === 0) {
            return null;
        }
        return this.toProfile(resp.data[0]);
    }

    async findByUsername(username: string): Promise<KeycloakUserProfile | null> {
        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'dev');
        const resp = await this.kcRequest<KeycloakUser[]>(
            'get',
            `/admin/realms/${realm}/users?username=${encodeURIComponent(username)}&exact=true`,
        );
        if (!resp.data || resp.data.length === 0) {
            return null;
        }
        return this.toProfile(resp.data[0]);
    }

    async createUser(payload: {
        email: string;
        username: string;
        password: string;
        attributes?: Partial<KeycloakUserProfile>;
    }): Promise<KeycloakUserProfile> {
        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'dev');
        const userBody = {
            email: payload.email,
            username: payload.username,
            enabled: true,
            emailVerified: true,
            credentials: [
                {
                    type: 'password',
                    value: payload.password,
                    temporary: false,
                },
            ],
            attributes: this.toAttributes(payload.attributes ?? {}),
        };

        try {
            await this.kcRequest('post', `/admin/realms/${realm}/users`, userBody);
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 409) {
                // user exists -> return existing by email or username
                const existing =
                    (await this.findByEmail(payload.email)) ||
                    (await this.findByUsername(payload.username));
                if (existing) {
                    this.logger.log(
                        `User already exists in Keycloak, reusing user ${existing.id} (${existing.email})`,
                    );
                    return existing;
                }
            }
            throw error;
        }

        const created = await this.findByEmail(payload.email);
        if (!created) {
            throw new Error('Failed to create user in Keycloak');
        }
        return created;
    }

    async updateUser(
        id: string,
        partial: Partial<Omit<KeycloakUserProfile, 'id' | 'email' | 'username'>>,
    ): Promise<KeycloakUserProfile> {
        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'dev');
        const existing = await this.findById(id);
        const merged: KeycloakUserProfile = {
            ...existing,
            ...partial,
            categoryLimits: partial.categoryLimits ?? existing.categoryLimits ?? {},
            notificationSettings:
                partial.notificationSettings ?? existing.notificationSettings ?? this.defaultNotificationSettings(),
        };

        await this.kcRequest('put', `/admin/realms/${realm}/users/${id}`, {
            email: merged.email,
            username: merged.username,
            enabled: true,
            attributes: this.toAttributes(merged),
        });

        return this.findById(id);
    }

    private toProfile(user: KeycloakUser): KeycloakUserProfile {
        const attrs = user.attributes || {};
        const getNum = (key: string, fallback = 0) =>
            attrs[key]?.[0] !== undefined ? Number(attrs[key][0]) || fallback : fallback;
        const parseJson = <T>(key: string, fallback: T): T => {
            try {
                return attrs[key]?.[0] ? JSON.parse(attrs[key][0]) : fallback;
            } catch {
                return fallback;
            }
        };

        return {
            id: user.id,
            email: user.email || '',
            username: user.username || '',
            balance: getNum('balance', 0),
            financialCushion: getNum('financialCushion', 0),
            transactionLimit: getNum('transactionLimit', 0),
            categoryLimits: parseJson<Record<string, number>>('categoryLimits', {}),
            notificationSettings: parseJson('notificationSettings', this.defaultNotificationSettings()),
            fcmToken: attrs['fcmToken']?.[0],
        };
    }

    private toAttributes(profile: Partial<KeycloakUserProfile>) {
        const attrs: Record<string, string[]> = {};
        const setNum = (key: keyof KeycloakUserProfile) => {
            const value = profile[key];
            if (value !== undefined && value !== null) {
                attrs[key as string] = [String(value)];
            }
        };

        setNum('balance');
        setNum('financialCushion');
        setNum('transactionLimit');

        if (profile.categoryLimits !== undefined) {
            attrs['categoryLimits'] = [JSON.stringify(profile.categoryLimits)];
        }
        if (profile.notificationSettings !== undefined) {
            attrs['notificationSettings'] = [JSON.stringify(profile.notificationSettings)];
        }
        if (profile.fcmToken !== undefined) {
            attrs['fcmToken'] = [profile.fcmToken];
        }
        return attrs;
    }

    private defaultNotificationSettings() {
        return {
            categoryLimitWarning: true,
            financialCushionWarning: true,
            anomalousTransactionAlert: true,
            monthlyReport: true,
        };
    }
}
