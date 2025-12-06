import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponse {
    @ApiProperty({
        description: 'id транзакции',
        example: 1,
    })
    id: number;

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

    @ApiProperty({
        description: 'refNo транзакции',
        example: '21313423t4041231',
    })
    refNo: string;

    @ApiProperty({
        description: 'Дата транзакции',
        example: '2024-01-15',
        type: Date,
    })
    transactionDate: Date;
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
