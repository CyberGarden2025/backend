import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class PredictDto {
    @ApiProperty({ description: 'Дата транзакции', example: '2023-11-15' })
    @IsDateString()
    transactionDate: string;

    @ApiProperty({ description: 'Номер референса', required: false })
    @IsOptional()
    @IsString()
    refNo?: string;

    @ApiProperty({ description: 'Сумма списания', example: 150.0 })
    @IsNumber()
    withdrawal: number;

    @ApiProperty({ description: 'Сумма пополнения', example: 0.0 })
    @IsNumber()
    deposit: number;

    @ApiProperty({ description: 'Баланс', example: 5000.0 })
    @IsNumber()
    balance: number;
}

