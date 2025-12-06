import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class MonthSummaryDto {
    @ApiProperty({
        description: 'Дата месяца в формате дд/мм/гггг',
        example: '01/12/2023',
    })
    @IsString()
    @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
        message: 'Дата должна быть в формате дд/мм/гггг',
    })
    monthDate: string;
}

