import { Controller, Post, Body, Param, Patch, Get, Query, ParseIntPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UserService } from 'src/user/user.service';
import {
    appendNotificationLog,
    maskToken,
    readNotificationLogs,
} from 'src/common/logger/notification-audit';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateFcmTokenDto } from './dto/create-fcm-token.dto';

@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly userService: UserService,
    ) {}

    @Post('send')
    async sendNotification(
        @Body()
        body: CreateNotificationDto,
    ) {
        const userToken = await this.getUserToken(1);

        try {
            const response = await this.notificationService.sendNotification(
                userToken,
                {
                    title: body.title,
                    body: body.body,
                },
                body.data,
            );

            await appendNotificationLog({
                timestamp: new Date().toISOString(),
                type: 'send',
                userId: 1,
                tokenMasked: maskToken(userToken),
                status: 'success',
                messageId: response.responses?.[0]?.messageId,
                meta: {
                    title: body.title,
                },
            });

            return response;
        } catch (error: any) {
            await appendNotificationLog({
                timestamp: new Date().toISOString(),
                type: 'send',
                userId: 1,
                tokenMasked: maskToken(userToken),
                status: 'error',
                error: error?.message || 'Send failed',
                meta: {
                    title: body.title,
                },
            });
            throw error;
        }
    }

    @Patch('token')
    async updateFcmToken(@Body() body: CreateFcmTokenDto) {
        try {
            const updated = await this.userService.update(1, { fcmToken: body.fcmToken });

            await appendNotificationLog({
                timestamp: new Date().toISOString(),
                type: 'token_update',
                userId: 1,
                tokenMasked: maskToken(body.fcmToken),
                status: 'success',
            });

            return updated;
        } catch (error: any) {
            await appendNotificationLog({
                timestamp: new Date().toISOString(),
                type: 'token_update',
                userId: 1,
                tokenMasked: maskToken(body.fcmToken),
                status: 'error',
                error: error?.message || 'Token update failed',
            });
            throw error;
        }
    }

    @Post('topic/:topic')
    async sendToTopic(
        @Param('topic') topic: string,
        @Body()
        body: {
            title: string;
            body: string;
            data?: Record<string, string>;
        },
    ) {
        return this.notificationService.sendToTopic(
            topic,
            {
                title: body.title,
                body: body.body,
            },
            body.data,
        );
    }

    @Get('debug/logs')
    async getNotificationLogs(@Query('limit') limit?: string) {
        const parsedLimit = limit ? Number(limit) : 50;
        const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;
        return readNotificationLogs(safeLimit);
    }

    @Post('debug/client-log')
    async clientLog(
        @Body()
        body: {
            event: string;
            userId?: number;
            token?: string;
            payload?: Record<string, unknown>;
        },
    ) {
        await appendNotificationLog({
            timestamp: new Date().toISOString(),
            type: 'client_event',
            userId: body.userId,
            tokenMasked: maskToken(body.token),
            status: 'success',
            meta: {
                event: body.event,
                payload: body.payload,
            },
        });
        return { ok: true };
    }

    @Post('check/:userId')
    async checkNotifications(
        @Param('userId', ParseIntPipe) userId: number,
        @Body()
        body: {
            monthDate: string;
        },
    ) {
        return this.notificationService.checkUserNotifications(userId, body.monthDate);
    }

    private async getUserToken(userId: number): Promise<string> {
        const user = await this.userService.findById(userId);
        if (!user.fcmToken) {
            throw new Error('FCM токен не найден у пользователя');
        }
        return user.fcmToken;
    }
}
