import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateCategoryDto {
    @ApiProperty({
        description: 'Категория транзакции',
    })
    @IsOptional()
    category?: string;
}
