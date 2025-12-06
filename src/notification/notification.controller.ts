import { Controller, Post, Body, Param, Patch, Get, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UserService } from 'src/user/user.service';
import {
    appendNotificationLog,
    maskToken,
    readNotificationLogs,
} from 'src/common/logger/notification-audit';

@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly userService: UserService,
    ) {}

    @Post('send')
    async sendNotification(
        @Body()
        body: {
            userId: string;
            title: string;
            body: string;
            data?: Record<string, string>;
        },
    ) {
        const userToken = await this.getUserToken(body.userId);

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
                userId: body.userId,
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
                userId: body.userId,
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

    @Patch('token')
    async updateFcmToken(
        @Body('userId') userId: string,
        @Body('fcmToken') fcmToken: string,
    ) {
        try {
            const updated = await this.userService.update(userId, { fcmToken });

            await appendNotificationLog({
                timestamp: new Date().toISOString(),
                type: 'token_update',
                userId,
                tokenMasked: maskToken(fcmToken),
                status: 'success',
            });

            return updated;
        } catch (error: any) {
            await appendNotificationLog({
                timestamp: new Date().toISOString(),
                type: 'token_update',
                userId,
                tokenMasked: maskToken(fcmToken),
                status: 'error',
                error: error?.message || 'Token update failed',
            });
            throw error;
        }
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
            userId?: string;
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
        @Param('userId') userId: string,
        @Body()
        body: {
            monthDate: string;
        },
    ) {
        return this.notificationService.checkUserNotifications(userId, body.monthDate);
    }

    private async getUserToken(userId: string): Promise<string> {
        const user = await this.userService.findById(userId);
        if (!user.fcmToken) {
            throw new Error('FCM токен не найден у пользователя');
        }
        return user.fcmToken;
    }
}
