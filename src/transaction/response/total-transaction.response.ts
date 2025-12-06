import { ApiProperty } from '@nestjs/swagger';

export class TotalTransactionResponse {
    @ApiProperty({
        description: 'Доходы за месяц',
        example: 1000.5,
    })
    income: number;
    @ApiProperty({
        description: 'Расходы за месяц',
        example: 1000.5,
    })
    expense: number;
}
