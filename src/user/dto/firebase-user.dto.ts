import { ApiProperty } from '@nestjs/swagger';

export class FirebaseUserDto {
    @ApiProperty({
        description: 'ID пользователя (Keycloak UUID)',
        example: '150d4b8d-c9a7-46ee-8238-c3feae6c286b',
    })
    id: string;

    @ApiProperty({ description: 'Email пользователя', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'Имя пользователя', example: 'john_doe' })
    username: string;

    @ApiProperty({ description: 'Текущий баланс', example: 50000 })
    balance: number;

    @ApiProperty({ description: 'Финансовая подушка', example: 100000 })
    financialCushion: number;

    @ApiProperty({
        description: 'Лимиты по категориям',
        example: { Food: 10000, Transport: 5000 },
    })
    categoryLimits: Record<string, number>;

    @ApiProperty({
        description: 'Настройки уведомлений',
        example: {
            categoryLimitWarning: true,
            financialCushionWarning: true,
            anomalousTransactionAlert: true,
            monthlyReport: true,
        },
    })
    notificationSettings: {
        categoryLimitWarning: boolean;
        financialCushionWarning: boolean;
        anomalousTransactionAlert: boolean;
        monthlyReport: boolean;
    };

    @ApiProperty({ description: 'FCM токен для уведомлений', example: 'fcm_token_here' })
    fcmToken?: string;
}
