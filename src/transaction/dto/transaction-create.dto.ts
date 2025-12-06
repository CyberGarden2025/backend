import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Matches, IsOptional } from 'class-validator';

export class TransactionCreateDto {
    @ApiProperty({
        description: 'Дата месяца в формате дд/мм/гггг или дд.мм.гггг',
        example: '01/12/2023',
    })
    @IsString()
    @Matches(/^\d{2}[./]\d{2}[./]\d{4}$/, {
        message: 'Дата должна быть в формате дд/мм/гггг или дд.мм.гггг',
    })
    transactionDate: string;

    @ApiProperty({
        description: 'Категория',
        example: 'Food',
        required: false,
    })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({
        description: 'Сумма транзакции (положительная для дохода, отрицательная для расхода)',
        example: 3000,
    })
    @IsNumber()
    sum: number;
}
