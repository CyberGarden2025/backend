import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KeycloakUserService } from './keycloak-user.service';

@Module({
    controllers: [UserController],
    providers: [UserService, KeycloakUserService],
    exports: [UserService],
})
export class UserModule {}
