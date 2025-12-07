import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateLimitDto {
    @ApiProperty({
        description: 'Название лимита',
        example: 'Лимит на продукты',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Иконка лимита',
        example: 'shopping',
    })
    @IsString()
    @IsNotEmpty()
    icon: string;

    @ApiPropertyOptional({
        description: 'Описание лимита',
        example: 'Ежемесячный лимит на продукты питания',
        required: false,
    })
    @IsNotEmpty()
    description?: string;

    @ApiProperty({
        description: 'Сумма лимита',
        example: 10000,
    })
    @IsNotEmpty()
    @IsNumber()
    limit: number;

    @ApiProperty({
        description: 'Период лимита',
        example: 'monthly',
    })
    @IsString()
    @IsNotEmpty()
    period: string;

    @ApiProperty({
        description: 'Категории расходов',
        example: ['Food', 'Shopping'],
        type: [String],
    })
    @IsNotEmpty()
    categories: string[];
}
