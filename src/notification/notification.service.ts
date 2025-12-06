import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
    CategoryLimitWarningDto,
    FinancialCushionWarningDto,
    AnomalousTransactionDto,
    MonthlyReportDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly isFirebaseAvailable: boolean;

    constructor() {
        this.isFirebaseAvailable = admin.apps.length > 0;
        if (!this.isFirebaseAvailable) {
            this.logger.warn('Firebase is not initialized. Notifications will be disabled.');
        }
    }

    async sendNotification(
        tokens: string | string[],
        notification: {
            title: string;
            body: string;
        },
        data?: Record<string, string>,
    ) {
        if (!this.isFirebaseAvailable) {
            this.logger.warn('Firebase not available. Notification not sent.');
            return {
                successCount: 0,
                failureCount: 0,
                responses: [],
            };
        }

        const message = {
            notification,
            data,
            tokens: Array.isArray(tokens) ? tokens : [tokens],
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            this.logger.log(`Успешно отправлено: ${response.successCount}, Неудачно: ${response.failureCount}`);
            return response;
        } catch (error) {
            this.logger.error(`Ошибка отправки: ${error.message}`);
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
        if (!this.isFirebaseAvailable) {
            this.logger.warn('Firebase not available. Notification not sent.');
            return null;
        }

        const message = {
            notification,
            data,
            topic,
        };

        try {
            const response = await admin.messaging().send(message);
            return response;
        } catch (error) {
            this.logger.error(`Ошибка отправки в тему: ${error.message}`);
            throw error;
        }
    }
}
