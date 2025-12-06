import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class BIQueryDto {
    @ApiProperty({
        description: 'Вопрос на естественном языке',
        example: 'Покажи динамику расходов по категориям за последние месяцы',
    })
    @IsString()
    question: string;

    @ApiProperty({
        description: 'Максимальное количество строк в результате',
        example: 200,
        required: false,
        default: 100,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(1000)
    max_rows?: number;
}

