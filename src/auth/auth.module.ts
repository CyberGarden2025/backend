import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
    AuthGuard,
    KeycloakConnectModule,
    ResourceGuard,
    RoleGuard,
} from 'nest-keycloak-connect';
import { KeycloakConfigService } from './keycloak-config.service';

@Module({
    imports: [
        ConfigModule,
        KeycloakConnectModule.registerAsync({
            useClass: KeycloakConfigService,
            inject: [ConfigService],
            imports: [ConfigModule],
        }),
    ],
    providers: [
        KeycloakConfigService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ResourceGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RoleGuard,
        },
    ],
    exports: [KeycloakConnectModule],
})
export class AuthModule {}
