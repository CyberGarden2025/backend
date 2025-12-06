import { Controller, Get, Param, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { TransactionsResponse } from './response/transaction.response';
import { TotalTransactionResponse } from './response/total-transaction.response';

@ApiTags('transactions')
@Controller()
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
    @ApiOkResponse({
        description: 'Доходы и расходы за текущий месяц',
        type: TotalTransactionResponse,
    })
    async getTotal(@Param('userId', ParseIntPipe) id: number): Promise<TotalTransactionResponse> {
        return this.service.getTotalTransactions(id);
    }
}
