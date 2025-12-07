import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
    CategoryLimitWarningDto,
    FinancialCushionWarningDto,
    AnomalousTransactionDto,
} from './dto/notification.dto';
import { UserService } from '../user/user.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly isFirebaseAvailable: boolean;

    constructor(
        private readonly userService: UserService,
        private readonly transactionService: TransactionService,
    ) {
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
            this.logger.log(
                `Успешно отправлено: ${response.successCount}, Неудачно: ${response.failureCount}`,
            );
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

    async checkUserNotifications(
        userId: string,
        monthDate: string,
    ): Promise<{
        categoryWarnings: CategoryLimitWarningDto[];
        financialCushionWarning: FinancialCushionWarningDto | null;
        anomalies: AnomalousTransactionDto[];
    }> {
        const [day, month, year] = monthDate.split('/').map(Number);
        const checkDate = new Date(year, month - 1, day || 1);
        const yearNum = checkDate.getFullYear();
        const monthNum = checkDate.getMonth() + 1;

        const user = await this.userService.findById(userId);

        const defaultNotificationSettings = {
            categoryLimitWarning: true,
            financialCushionWarning: true,
            anomalousTransactionAlert: true,
            monthlyReport: true,
        };

        const notificationSettings = {
            ...defaultNotificationSettings,
            ...(user.notificationSettings || {}),
        };

        const categoryLimits = user.categoryLimits || {};
        const hasCategoryLimits = Object.keys(categoryLimits).length > 0;

        const result = {
            categoryWarnings: [] as CategoryLimitWarningDto[],
            financialCushionWarning: null as FinancialCushionWarningDto | null,
            anomalies: [] as AnomalousTransactionDto[],
        };

        // Категории и лимиты
        if (notificationSettings.categoryLimitWarning && hasCategoryLimits) {
            const categoryExpensesMap = await this.transactionService.getExpensesByCategoryForMonth(
                userId,
                yearNum,
                monthNum,
            );

            Object.entries(categoryLimits).forEach(([category, limit]) => {
                if (!limit || limit <= 0) {
                    return;
                }
                const spent = categoryExpensesMap.get(category) || 0;
                if (spent <= 0) {
                    return;
                }
                const usagePercentage = Math.round((spent / limit) * 1000) / 10;

                if (usagePercentage >= 80) {
                    const warning: CategoryLimitWarningDto = {
                        userId,
                        category,
                        currentSpending: Math.round(spent * 100) / 100,
                        limit,
                        usagePercentage,
                    };
                    result.categoryWarnings.push(warning);

                    if (this.isFirebaseAvailable && user.fcmToken) {
                        void this.sendNotification(
                            user.fcmToken,
                            {
                                title: 'Лимит по категории',
                                body: `Категория ${category}: использовано ${usagePercentage}% лимита`,
                            },
                            {
                                type: 'category_limit',
                                category,
                                usage: usagePercentage.toString(),
                            },
                        ).catch(error => {
                            this.logger.error(
                                `Failed to send category limit notification: ${error.message}`,
                            );
                        });
                    }
                }
            });
        }

        // Финансовая подушка
        if (
            notificationSettings.financialCushionWarning &&
            user.financialCushion &&
            user.financialCushion > 0
        ) {
            const currentCushion = user.balance ?? 0;
            const recommendedCushion = user.financialCushion;
            const percentage = Math.round((currentCushion / recommendedCushion) * 1000) / 10;

            if (percentage > 0 && percentage < 80) {
                const warning: FinancialCushionWarningDto = {
                    userId,
                    currentCushion,
                    recommendedCushion,
                    percentage,
                };
                result.financialCushionWarning = warning;

                if (this.isFirebaseAvailable && user.fcmToken) {
                    void this.sendNotification(
                        user.fcmToken,
                        {
                            title: 'Финансовая подушка',
                            body: `Финансовая подушка покрывает только ${percentage}% от рекомендуемой`,
                        },
                        {
                            type: 'financial_cushion',
                            percentage: percentage.toString(),
                        },
                    ).catch(error => {
                        this.logger.error(
                            `Failed to send financial cushion notification: ${error.message}`,
                        );
                    });
                }
            }
        }

        // Аномальные транзакции (простое правило)
        if (notificationSettings.anomalousTransactionAlert) {
            const withdrawals = await this.transactionService.getWithdrawalsForMonthWithIds(
                userId,
                yearNum,
                monthNum,
            );

            const statsByCategory = new Map<
                string,
                { sum: number; count: number; items: { id: number; amount: number }[] }
            >();

            withdrawals.forEach(tx => {
                const key = tx.category || 'Без категории';
                const stat = statsByCategory.get(key) || {
                    sum: 0,
                    count: 0,
                    items: [],
                };
                stat.sum += tx.amount;
                stat.count += 1;
                stat.items.push({ id: tx.id, amount: tx.amount });
                statsByCategory.set(key, stat);
            });

            const anomalies: AnomalousTransactionDto[] = [];

            statsByCategory.forEach((stat, category) => {
                if (stat.count < 3) {
                    return;
                }
                const mean = stat.sum / stat.count;
                const threshold = mean * 3;

                stat.items.forEach(item => {
                    if (item.amount > threshold && item.amount > 0) {
                        anomalies.push({
                            userId,
                            transactionId: item.id,
                            amount: Math.round(item.amount * 100) / 100,
                            category,
                            reason: 'Сумма значительно превышает средний расход по категории',
                        });
                    }
                });
            });

            result.anomalies = anomalies;

            if (anomalies.length > 0 && this.isFirebaseAvailable && user.fcmToken) {
                const first = anomalies[0];
                void this.sendNotification(
                    user.fcmToken,
                    {
                        title: 'Аномальные операции',
                        body: `Обнаружены необычные траты, например ${first.amount} в категории ${first.category}`,
                    },
                    {
                        type: 'anomaly',
                        count: anomalies.length.toString(),
                    },
                ).catch(error => {
                    this.logger.error(
                        `Failed to send anomalous transactions notification: ${error.message}`,
                    );
                });
            }
        }

        return result;
    }
}
