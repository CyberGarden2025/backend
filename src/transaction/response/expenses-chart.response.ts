import { ApiProperty } from '@nestjs/swagger';

export class MonthData {
    @ApiProperty({ description: 'Месяц (сокращение)', example: 'Дек' })
    month: string;

    @ApiProperty({ description: 'Месяц (полное название)', example: 'Декабрь' })
    monthFull: string;

    @ApiProperty({ description: 'Год', example: 2023 })
    year: number;

    @ApiProperty({ description: 'Сумма расходов', example: 109592 })
    amount: number;

    @ApiProperty({ description: 'Является ли прогнозом', example: false })
    isPrediction: boolean;
}

export class ExpensesChartResponse {
    @ApiProperty({ description: 'Расходы за текущий месяц (декабрь)', example: 109592 })
    currentMonthExpenses: number;

    @ApiProperty({ description: 'Данные по месяцам', type: [MonthData] })
    months: MonthData[];
}

