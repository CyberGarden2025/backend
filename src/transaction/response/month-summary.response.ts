import { ApiProperty } from '@nestjs/swagger';

export class MonthSummaryResponse {
    @ApiProperty({ description: 'Месяц (сокращение)', example: 'Дек' })
    month: string;

    @ApiProperty({ description: 'Месяц (полное название)', example: 'Декабрь' })
    monthFull: string;

    @ApiProperty({ description: 'Год', example: 2023 })
    year: number;

    @ApiProperty({ description: 'Поступления (доходы)', example: 229910 })
    income: number;

    @ApiProperty({ description: 'Расходы', example: 109592 })
    expenses: number;

    @ApiProperty({ description: 'Баланс (доходы - расходы)', example: 120318 })
    balance: number;

    @ApiProperty({ description: 'Процент расходов от доходов', example: 47.7 })
    expensesPercentage: number;
}

