import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KeycloakUserProfile, KeycloakUserService } from './keycloak-user.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(private readonly kcUserService: KeycloakUserService) {}

    async findById(id: string): Promise<KeycloakUserProfile> {
        try {
            return await this.kcUserService.findById(id);
        } catch (error) {
            this.logger.warn(`User ${id} not found in Keycloak: ${error}`);
            throw new NotFoundException('User not found');
        }
    }

    async findOne(options: { where: { email?: string } }): Promise<KeycloakUserProfile | null> {
        const email = options.where.email;
        if (!email) return null;
        return this.kcUserService.findByEmail(email);
    }

    async createUser(payload: {
        email: string;
        username: string;
        password: string;
        balance?: number;
        financialCushion?: number;
        transactionLimit?: number;
        categoryLimits?: Record<string, number>;
        notificationSettings?: any;
        fcmToken?: string;
    }): Promise<KeycloakUserProfile> {
        return this.kcUserService.createUser({
            email: payload.email,
            username: payload.username,
            password: payload.password,
            attributes: {
                balance: payload.balance ?? 0,
                financialCushion: payload.financialCushion ?? 0,
                transactionLimit: payload.transactionLimit ?? 0,
                categoryLimits: payload.categoryLimits ?? {},
                notificationSettings: payload.notificationSettings,
                fcmToken: payload.fcmToken,
            } as any,
        });
    }

    async update(
        id: string,
        payload: Partial<Omit<KeycloakUserProfile, 'id' | 'email' | 'username'>>,
    ): Promise<KeycloakUserProfile> {
        return this.kcUserService.updateUser(id, payload);
    }
}
