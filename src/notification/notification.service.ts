import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
    constructor() {}

    async sendNotification(
        tokens: string | string[],
        notification: {
            title: string;
            body: string;
        },
        data?: Record<string, string>,
    ) {
        const message = {
            notification,
            data,
            tokens: Array.isArray(tokens) ? tokens : [tokens],
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log('Успешно отправлено:', response.successCount);
            console.log('Неудачно:', response.failureCount);
            return response;
        } catch (error) {
            console.error('Ошибка отправки:', error);
            throw error;
        }
    }

    async sendToTopic(
        topic: string,
        notification: {
            title: string;
            body: string;
        },
        data?: Record<string, string>,
    ) {
        const message = {
            notification,
            data,
            topic,
        };

        try {
            const response = await admin.messaging().send(message);
            return response;
        } catch (error) {
            console.error('Ошибка отправки в тему:', error);
            throw error;
        }
    }
}
