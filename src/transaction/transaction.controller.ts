import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { TransactionsResponse } from './response/transaction.response';
import { TotalTransactionResponse } from './response/total-transaction.response';
import { TransactionPeriodDto } from './dto/transaction-perios.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
    constructor(private readonly service: TransactionService) {}

    @Get('/:userId')
    @ApiParam({
        name: 'userId',
        description: 'ID пользователя',
        type: Number,
    })
    @ApiOkResponse({
        description: 'Список транзакций пользователя, сгруппированных по дате',
        type: [TransactionsResponse],
    })
    async findAll(@Param('userId', ParseIntPipe) id: number): Promise<TransactionsResponse[]> {
        return this.service.getTransactionsGroupedByDate({
            where: {
                userId: id,
            },
        });
    }

    @Get('/:userId/total')
    @ApiParam({
        name: 'userId',
        description: 'ID пользователя',
        type: Number,
    })
    @ApiQuery({
        name: 'start',
        description: 'Начальная дата периода (YYYY-MM-DD)',
        example: '2023-08-01',
        type: String,
        required: true,
    })
    @ApiQuery({
        name: 'end',
        description: 'Конечная дата периода (YYYY-MM-DD)',
        example: '2023-08-31',
        type: String,
        required: true,
    })
    @ApiOkResponse({
        description: 'Доходы и расходы за указанный период',
        type: TotalTransactionResponse,
    })
    async getTotal(
        @Param('userId', ParseIntPipe) id: number,
        @Query() periodDto: TransactionPeriodDto,
    ): Promise<TotalTransactionResponse> {
        return this.service.getTotalTransactions(id, periodDto.start, periodDto.end);
    }
}
