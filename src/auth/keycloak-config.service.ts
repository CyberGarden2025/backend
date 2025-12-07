import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    KeycloakConnectOptions,
    KeycloakConnectOptionsFactory,
    PolicyEnforcementMode,
    TokenValidation,
} from 'nest-keycloak-connect';

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
    private readonly logger = new Logger(KeycloakConfigService.name);

    constructor(private readonly configService: ConfigService) {}

    async createKeycloakConnectOptions(): Promise<KeycloakConnectOptions> {
        const tokenValidation =
            (this.configService.get<TokenValidation>('KEYCLOAK_TOKEN_VALIDATION') as
                | TokenValidation
                | undefined) ?? TokenValidation.ONLINE;

        const publicAuthServerUrl = this.getRequired(
            'KEYCLOAK_AUTH_SERVER_URL',
            'http://localhost:8080',
        );
        const internalAuthServerUrl =
            this.configService.get<string>('KEYCLOAK_INTERNAL_URL') ?? publicAuthServerUrl;
        const realm = this.getRequired('KEYCLOAK_REALM', 'master');

        const options: KeycloakConnectOptions = {
            // authServerUrl must match the token issuer (KC_HOSTNAME_URL), i.e. public URL
            authServerUrl: publicAuthServerUrl,
            realm,
            clientId: this.getRequired('KEYCLOAK_CLIENT_ID', 'my-nestjs-app'),
            secret: this.getRequired('KEYCLOAK_CLIENT_SECRET'),
            bearerOnly: true,
            policyEnforcement:
                (this.configService.get<PolicyEnforcementMode>('KEYCLOAK_POLICY_ENFORCEMENT') as
                    | PolicyEnforcementMode
                    | undefined) ?? PolicyEnforcementMode.PERMISSIVE,
            tokenValidation,
        };

        let realmPublicKey = this.configService.get<string>('KEYCLOAK_REALM_PUBLIC_KEY');

        const fetchedKey = await this.fetchRealmPublicKey(internalAuthServerUrl, realm);
        if (fetchedKey) {
            realmPublicKey = fetchedKey;
            this.logger.log('Fetched realm public key from Keycloak');
        } else if (realmPublicKey) {
            this.logger.warn(
                'Using KEYCLOAK_REALM_PUBLIC_KEY from env because automatic fetch failed',
            );
        } else {
            this.logger.warn(
                'Proceeding without realm public key; token validation may fail if offline validation is required',
            );
        }

        if (realmPublicKey) {
            options.realmPublicKey = realmPublicKey;
        } else if (tokenValidation === TokenValidation.OFFLINE) {
            this.logger.warn(
                'Offline token validation is enabled but no realm public key is configured; validation will fail.',
            );
        }

        this.logger.log(
            `Keycloak initialized: realm=${options.realm}, clientId=${options.clientId}, url=${options.authServerUrl}`,
        );

        return options;
    }

    private async fetchRealmPublicKey(authServerUrl: string, realm: string): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
                const response = await fetch(`${authServerUrl}/realms/${realm}`, {
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Keycloak realm fetch failed with status ${response.status}`);
                }
                const data = (await response.json()) as { public_key?: string };
                return data.public_key ?? null;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('aborted')) {
                this.logger.warn(`Timeout while fetching realm public key from ${authServerUrl}`);
            } else {
                this.logger.warn(`Failed to fetch realm public key: ${errorMessage}`);
            }
            return null;
        }
    }

    private getRequired(key: string, fallback?: string): string {
        const value = this.configService.get<string>(key) ?? fallback;
        if (!value) {
            throw new Error(`Missing required configuration: ${key}`);
        }
        return value;
    }
}
