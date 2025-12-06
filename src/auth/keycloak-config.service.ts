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

    createKeycloakConnectOptions(): KeycloakConnectOptions {
        const tokenValidation =
            (this.configService.get<TokenValidation>('KEYCLOAK_TOKEN_VALIDATION') as
                | TokenValidation
                | undefined) ?? TokenValidation.ONLINE;

        const options: KeycloakConnectOptions = {
            authServerUrl: this.getRequired('KEYCLOAK_AUTH_SERVER_URL', 'http://localhost:8080'),
            realm: this.getRequired('KEYCLOAK_REALM', 'master'),
            clientId: this.getRequired('KEYCLOAK_CLIENT_ID', 'my-nestjs-app'),
            secret: this.getRequired('KEYCLOAK_CLIENT_SECRET'),
            bearerOnly: true,
            policyEnforcement:
                (this.configService.get<PolicyEnforcementMode>('KEYCLOAK_POLICY_ENFORCEMENT') as
                    | PolicyEnforcementMode
                    | undefined) ?? PolicyEnforcementMode.PERMISSIVE,
            tokenValidation,
        };

        const realmPublicKey = this.configService.get<string>('KEYCLOAK_REALM_PUBLIC_KEY');
        if (realmPublicKey) {
            options.realmPublicKey = realmPublicKey;
        }

        this.logger.log(
            `Keycloak initialized: realm=${options.realm}, clientId=${options.clientId}, url=${options.authServerUrl}`,
        );

        return options;
    }

    private getRequired(key: string, fallback?: string): string {
        const value = this.configService.get<string>(key) ?? fallback;
        if (!value) {
            throw new Error(`Missing required configuration: ${key}`);
        }
        return value;
    }
}
