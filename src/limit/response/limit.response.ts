import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LimitResponse {
    @ApiProperty({
        description: 'Название лимита',
        example: 'Лимит на продукты',
    })
    name: string;

    @ApiProperty({
        description: 'Иконка лимита',
        example: 'shopping',
    })
    icon: string;

    @ApiPropertyOptional({
        description: 'Описание лимита',
        example: 'Ежемесячный лимит на продукты питания',
        required: false,
    })
    description?: string;

    @ApiProperty({
        description: 'Сумма лимита',
        example: 10000,
    })
    limit: number;

    @ApiProperty({
        description: 'Сумма потраченного',
        example: 10000,
    })
    spent: number;

    @ApiProperty({
        description: 'Период лимита',
        example: 'monthly',
    })
    period: string;

    @ApiProperty({
        description: 'Категории расходов',
        example: ['Food', 'Shopping'],
        type: [String],
    })
    categories: string[];
}
