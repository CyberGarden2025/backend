import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ForecastDto {
    @ApiProperty({
        description: 'Количество месяцев',
    })
    @IsString({ message: 'Токен должен быть строкой' })
    forecastMonths?: number;
}
