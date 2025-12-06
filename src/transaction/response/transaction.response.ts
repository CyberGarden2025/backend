import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponse {
    @ApiProperty({
        description: 'Категория транзакции',
        example: 'deposit',
    })
    category: string;

    @ApiProperty({
        description: 'Сумма транзакции',
        example: 1000.5,
    })
    sum: number;
}

export class TransactionsResponse {
    @ApiProperty({
        description: 'Дата транзакции',
        example: '2024-01-15',
        type: Date,
    })
    date: Date;

    @ApiProperty({
        description: 'Сумма за день',
        example: 3000,
        type: Number,
    })
    daySum: number;

    @ApiProperty({
        description: 'Информация о транзакции',
        type: [TransactionResponse],
    })
    transaction: TransactionResponse[];
}
