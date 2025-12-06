import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional } from 'class-validator';

export class UpdateUserSettingsDto {
    @ApiPropertyOptional({
        description: 'Финансовая подушка пользователя',
        example: 100000,
    })
    @IsOptional()
    @IsNumber()
    financialCushion?: number;

    @ApiPropertyOptional({
        description: 'Общий лимит по транзакциям',
        example: 200000,
    })
    @IsOptional()
    @IsNumber()
    transactionLimit?: number;

    @ApiPropertyOptional({
        description: 'Лимиты по категориям расходов',
        example: { Food: 10000, Transport: 5000 },
    })
    @IsOptional()
    @IsObject()
    categoryLimits?: Record<string, number>;

    @ApiPropertyOptional({
        description: 'Настройки уведомлений',
        example: {
            categoryLimitWarning: true,
            financialCushionWarning: true,
            anomalousTransactionAlert: true,
            monthlyReport: true,
        },
    })
    @IsOptional()
    @IsObject()
    notificationSettings?: {
        categoryLimitWarning?: boolean;
        financialCushionWarning?: boolean;
        anomalousTransactionAlert?: boolean;
        monthlyReport?: boolean;
    };

    @ApiPropertyOptional({
        description: 'FCM токен для push-уведомлений',
        example: 'fcm_token_here',
    })
    @IsOptional()
    fcmToken?: string;
}


