import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Put,
} from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { FirebaseUserDto } from './dto/firebase-user.dto';
import { UpdateUserSettingsDto } from './dto/user-settings.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':id/profile')
    @ApiParam({
        name: 'id',
        description: 'ID пользователя',
        type: Number,
    })
    @ApiOkResponse({
        description: 'Профиль пользователя для фронта / Firebase',
        type: FirebaseUserDto,
    })
    async getProfile(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<FirebaseUserDto> {
        const user = await this.userService.findById(id);
        return this.toFirebaseDto(user as any);
    }

    @Put(':id/profile')
    @ApiParam({
        name: 'id',
        description: 'ID пользователя',
        type: Number,
    })
    @ApiOkResponse({
        description: 'Обновлённый профиль пользователя',
        type: FirebaseUserDto,
    })
    async updateProfile(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserSettingsDto,
    ): Promise<FirebaseUserDto> {
        const updated = await this.userService.update(id, {
            financialCushion: dto.financialCushion,
            transactionLimit: dto.transactionLimit,
            categoryLimits: dto.categoryLimits,
            notificationSettings: dto.notificationSettings,
            fcmToken: dto.fcmToken,
        });

        return this.toFirebaseDto(updated as any);
    }

    private toFirebaseDto(user: any): FirebaseUserDto {
        const defaultNotificationSettings = {
            categoryLimitWarning: true,
            financialCushionWarning: true,
            anomalousTransactionAlert: true,
            monthlyReport: true,
        };

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            balance: user.balance ?? 0,
            financialCushion: user.financialCushion ?? 0,
            categoryLimits: user.categoryLimits ?? {},
            notificationSettings:
                user.notificationSettings ?? defaultNotificationSettings,
            fcmToken: user.fcmToken,
        };
    }
}


