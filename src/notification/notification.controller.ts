import { Controller, Post, Body, Param, Patch, ParseIntPipe } from '@nestjs/common';
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
            userId: number;
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
        @Body('userId', ParseIntPipe) userId: number,
        @Body('fcmToken') fcmToken: string,
    ) {
        return this.userService.update(userId, { fcmToken });
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
        const user = await this.userService.findOne({
            where: {
                id: userId,
            },
        });

        return user.fcmToken;
    }
}
