import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ForecastDto {
    @ApiProperty({
        description: 'Количество месяцев',
        required: false,
    })
    @IsOptional()
    forecastMonths?: number;
}
