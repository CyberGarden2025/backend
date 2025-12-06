import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class TransactionPeriodDto {
    @ApiProperty({
        description: 'Начальная дата периода (формат: YYYY-MM-DD)',
        example: '2023-08-01',
        type: String,
    })
    @IsNotEmpty()
    @IsDateString()
    start: string;

    @ApiProperty({
        description: 'Конечная дата периода (формат: YYYY-MM-DD)',
        example: '2023-08-31',
        type: String,
    })
    @IsNotEmpty()
    @IsDateString()
    end: string;
}
