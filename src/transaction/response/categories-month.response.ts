import { ApiProperty } from '@nestjs/swagger';

export class CategoryExpense {
    @ApiProperty({ description: 'Название категории', example: 'Продукты' })
    category: string;

    @ApiProperty({ description: 'Сумма расходов', example: 30000 })
    amount: number;

    @ApiProperty({ description: 'Процент от общей суммы', example: 30.5 })
    percentage: number;
}

export class CategoriesMonthResponse {
    @ApiProperty({ description: 'Месяц (сокращение)', example: 'Дек' })
    month: string;

    @ApiProperty({ description: 'Месяц (полное название)', example: 'Декабрь' })
    monthFull: string;

    @ApiProperty({ description: 'Год', example: 2023 })
    year: number;

    @ApiProperty({ description: 'Общая сумма расходов за месяц', example: 109592 })
    totalExpenses: number;

    @ApiProperty({ description: 'Расходы по категориям', type: [CategoryExpense] })
    categories: CategoryExpense[];
}

