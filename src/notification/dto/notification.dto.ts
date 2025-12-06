import { ApiProperty } from '@nestjs/swagger';

export class CategoryLimitWarningDto {
    @ApiProperty({ description: 'ID пользователя', example: '150d4b8d-c9a7-46ee-8238-c3feae6c286b' })
    userId: string;

    @ApiProperty({ description: 'Категория', example: 'Food' })
    category: string;

    @ApiProperty({ description: 'Текущие расходы', example: 9500 })
    currentSpending: number;

    @ApiProperty({ description: 'Лимит категории', example: 10000 })
    limit: number;

    @ApiProperty({ description: 'Процент использования', example: 95 })
    usagePercentage: number;
}

export class FinancialCushionWarningDto {
    @ApiProperty({ description: 'ID пользователя', example: '150d4b8d-c9a7-46ee-8238-c3feae6c286b' })
    userId: string;

    @ApiProperty({ description: 'Текущая финансовая подушка', example: 50000 })
    currentCushion: number;

    @ApiProperty({ description: 'Рекомендуемая подушка', example: 100000 })
    recommendedCushion: number;

    @ApiProperty({ description: 'Процент от рекомендуемой', example: 50 })
    percentage: number;
}

export class AnomalousTransactionDto {
    @ApiProperty({ description: 'ID пользователя', example: '150d4b8d-c9a7-46ee-8238-c3feae6c286b' })
    userId: string;

    @ApiProperty({ description: 'ID транзакции', example: 123 })
    transactionId: number;

    @ApiProperty({ description: 'Сумма транзакции', example: 50000 })
    amount: number;

    @ApiProperty({ description: 'Категория', example: 'Food' })
    category: string;

    @ApiProperty({ description: 'Причина аномалии', example: 'Сумма превышает среднюю в 5 раз' })
    reason: string;
}

export class MonthlyReportDto {
    @ApiProperty({ description: 'ID пользователя', example: '150d4b8d-c9a7-46ee-8238-c3feae6c286b' })
    userId: string;

    @ApiProperty({ description: 'Месяц', example: 'Декабрь 2023' })
    month: string;

    @ApiProperty({ description: 'Общий доход', example: 229910 })
    totalIncome: number;

    @ApiProperty({ description: 'Общие расходы', example: 109592 })
    totalExpenses: number;

    @ApiProperty({ description: 'Баланс', example: 120318 })
    balance: number;

    @ApiProperty({ description: 'Топ категории расходов', example: [{ category: 'Food', amount: 30000 }] })
    topCategories: Array<{ category: string; amount: number }>;
}
