import { Controller, Post, Body, Param, Patch, ParseUUIDPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UserService } from 'src/user/user.service';

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

        return this.notificationService.sendNotification(
            userToken,
            {
                title: body.title,
                body: body.body,
            },
            body.data,
        );
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
        @Param('userId', ParseUUIDPipe) userId: number,
        @Body()
        body: {
            fcmToken: string;
        },
    ) {
        return this.userService.update(userId, { fcmToken: body.fcmToken });
    }

    private async getUserToken(userId: string): Promise<string> {
        return this.userService.findOne({
            where: {
                id: userId,
            },
        });
    }
}
