import { Controller, Get, Post, Patch, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { TransactionResponse, TransactionsResponse } from './response/transaction.response';
import { TotalTransactionResponse } from './response/total-transaction.response';
import { TransactionPeriodDto } from './dto/transaction-perios.dto';
import { ExpensesChartResponse } from './response/expenses-chart.response';
import { ExpensesChartDto } from './dto/expenses-chart.dto';
import { CategoriesMonthResponse } from './response/categories-month.response';
import { CategoriesMonthDto } from './dto/categories-month.dto';
import { MonthSummaryResponse } from './response/month-summary.response';
import { MonthSummaryDto } from './dto/month-summary.dto';
import { MLService } from '../ml/ml.service';
import { TransactionCreateDto } from './dto/transaction-create.dto';

@ApiTags('transactions')
@ApiBearerAuth('keycloak')
@Controller('transactions')
export class TransactionController {
    constructor(
        private readonly service: TransactionService,
        private readonly mlService: MLService,
    ) {}

    @Get()
    @ApiOkResponse({
        description: 'Список транзакций пользователя, сгруппированных по дате',
        type: [TransactionsResponse],
    })
    async findAll(): Promise<TransactionsResponse[]> {
        return this.service.getTransactionsGroupedByDate({
            where: {
                userId: 1,
            },
        });
    }

    @Get(':id')
    @ApiOkResponse({
        description: 'Возвращает транзакцию по id',
        type: TransactionResponse,
    })
    async findOne(@Param('id') id: number): Promise<TransactionResponse> {
        const transaction = await this.service.findById(id);
        return {
            ...transaction,
            sum: transaction.deposit - transaction.withdrawal,
        };
    }

    @Post('/:userId')
    @ApiParam({
        name: 'userId',
        description: 'ID пользователя',
        type: Number,
    })
    @ApiOkResponse({
        description: 'Транзакция успешно создана',
    })
    async create(@Param('userId', ParseIntPipe) userId: number, @Body() dto: TransactionCreateDto) {
        return this.service.createTransaction(userId, dto);
    }

    @Get('/:userId/total')
    @ApiParam({
        name: 'userId',
        description: 'ID пользователя',
        type: String,
        example: '150d4b8d-c9a7-46ee-8238-c3feae6c286b',
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
        @Param('userId') id: string,
        @Query() periodDto: TransactionPeriodDto,
    ): Promise<TotalTransactionResponse> {
        return this.service.getTotalTransactions(id, periodDto.start, periodDto.end);
    }

    @Post('/:userId/expenses-chart')
    @ApiParam({
        name: 'userId',
        description: 'ID пользователя',
        type: String,
        example: '150d4b8d-c9a7-46ee-8238-c3feae6c286b',
    })
    @ApiOkResponse({
        description: 'Расходы за указанный месяц и прогноз на 7 месяцев',
        type: ExpensesChartResponse,
    })
    async getExpensesChart(
        @Param('userId') userId: string,
        @Body() dto: ExpensesChartDto,
    ): Promise<ExpensesChartResponse> {
        const [day, month, year] = dto.startDate.split('/').map(Number);
        const baseDate = new Date(year, month - 1, day);
        const currentYear = baseDate.getFullYear();
        const currentMonth = baseDate.getMonth();

        const months: Array<{ date: Date; isPrediction: boolean }> = [];

        for (let i = -4; i <= 2; i++) {
            const monthDate = new Date(currentYear, currentMonth + i, 1);
            months.push({
                date: monthDate,
                isPrediction: i > 0,
            });
        }

        const queryStartDate = months[0].date;
        const queryEndDate = new Date(
            months[months.length - 1].date.getFullYear(),
            months[months.length - 1].date.getMonth() + 1,
            0,
        );

        const monthlyExpenses = await this.service.getExpensesByMonth(
            userId,
            queryStartDate,
            queryEndDate,
        );

        const monthData = months.map(({ date, isPrediction }) => {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                2,
                '0',
            )}`;
            const amount = monthlyExpenses.get(monthKey) || 0;
            const monthInfo = this.service.getMonthName(date.getMonth());

            return {
                month: monthInfo.short,
                monthFull: monthInfo.full,
                year: date.getFullYear(),
                amount: Math.round(amount * 100) / 100,
                isPrediction,
            };
        });

        const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const currentMonthExpenses = monthlyExpenses.get(currentMonthKey) || 0;

        const futureMonths = monthData.filter(m => m.isPrediction);
        if (futureMonths.length > 0) {
            const forecastData = await this.mlService.getFinancialForecast({
                userId,
                forecastMonths: futureMonths.length,
            });

            if (forecastData && forecastData.forecast) {
                forecastData.forecast.forEach((prediction: any, index: number) => {
                    if (index < futureMonths.length) {
                        futureMonths[index].amount =
                            Math.round(prediction.predicted_expenses * 100) / 100;
                    }
                });
            }
        }

        return {
            currentMonthExpenses: Math.round(currentMonthExpenses * 100) / 100,
            months: monthData,
        };
    }

    @Post('/:userId/categories-month')
    @ApiParam({
        name: 'userId',
        description: 'ID пользователя',
        type: Number,
    })
    @ApiOkResponse({
        description: 'Расходы по категориям за указанный месяц',
        type: CategoriesMonthResponse,
    })
    async getCategoriesByMonth(
        @Param('userId') userId: string,
        @Body() dto: CategoriesMonthDto,
    ): Promise<CategoriesMonthResponse> {
        const [day, month, year] = dto.monthDate.split('/').map(Number);
        const monthDate = new Date(year, month - 1, day);

        const categoryExpenses = await this.service.getExpensesByCategoryForMonth(
            userId,
            year,
            month,
        );

        const totalExpenses = Array.from(categoryExpenses.values()).reduce(
            (sum, amount) => sum + amount,
            0,
        );

        const categories = Array.from(categoryExpenses.entries())
            .map(([category, amount]) => ({
                category,
                amount: Math.round(amount * 100) / 100,
                percentage:
                    totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100 * 10) / 10 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        const monthInfo = this.service.getMonthName(monthDate.getMonth());

        return {
            month: monthInfo.short,
            monthFull: monthInfo.full,
            year,
            totalExpenses: Math.round(totalExpenses * 100) / 100,
            categories,
        };
    }

    @Post('/:userId/month-summary')
    @ApiParam({
        name: 'userId',
        description: 'ID пользователя',
        type: Number,
    })
    @ApiOkResponse({
        description: 'Поступления и расходы за указанный месяц',
        type: MonthSummaryResponse,
    })
    async getMonthSummary(
        @Param('userId') userId: string,
        @Body() dto: MonthSummaryDto,
    ): Promise<MonthSummaryResponse> {
        const [day, month, year] = dto.monthDate.split('/').map(Number);
        const monthDate = new Date(year, month - 1, day);

        const { income, expenses } = await this.service.getMonthSummary(userId, year, month);

        const balance = income - expenses;
        const expensesPercentage = income > 0 ? Math.round((expenses / income) * 100 * 10) / 10 : 0;

        const monthInfo = this.service.getMonthName(monthDate.getMonth());

        return {
            month: monthInfo.short,
            monthFull: monthInfo.full,
            year,
            income,
            expenses,
            balance,
            expensesPercentage,
        };
    }

    @Patch('/:userId/:transactionId/category')
    async updateCategory(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('transactionId', ParseIntPipe) transactionId: number,
        @Body('category') category: string,
    ): Promise<{ success: boolean }> {
        await this.service.updateCategory(userId, transactionId, category);
        return { success: true };
    }
}
