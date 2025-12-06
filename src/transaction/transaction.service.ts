import { Inject, Injectable, Logger } from '@nestjs/common';
import { FindOptions, Op } from 'sequelize';

import { RepositoryService } from '../common/repository/repository.service';
import { ModelType } from '../common/repository/type/model-type';
import Transaction from './transaction.model';
import { TransactionsResponse, TransactionResponse } from './response/transaction.response';
import { TotalTransactionResponse } from './response/total-transaction.response';
import { MonthData } from './response/expenses-chart.response';
import { TransactionCreateDto } from './dto/transaction-create.dto';
import { MLService } from '../ml/ml.service';
import { UserService } from '../user/user.service';
import { v4 } from 'uuid';

@Injectable()
export class TransactionService extends RepositoryService<Transaction> {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        @Inject('TRANSACTIONS_REPOSITORY')
        protected repository: ModelType<Transaction>,
        private readonly mlService: MLService,
        private readonly userService: UserService,
    ) {
        super(repository);
    }

    private parseDateFromDDMMYYYY(dateString: string): Date {
        // Поддерживаем как слеши, так и точки в качестве разделителей
        const separator = dateString.includes('.') ? '.' : '/';
        const [day, month, year] = dateString.split(separator).map(Number);
        return new Date(year, month - 1, day);
    }

    private formatDateToYYYYMMDD(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    async createTransaction(userId: number, payload: TransactionCreateDto): Promise<Transaction> {
        // Получаем пользователя (findById бросает NotFoundException если не найден)
        const user = await this.userService.findById(userId);

        // Парсим дату из формата dd/mm/yyyy
        const transactionDate = this.parseDateFromDDMMYYYY(payload.transactionDate);
        const formattedDate = this.formatDateToYYYYMMDD(transactionDate);

        // Определяем withdrawal и deposit из sum
        let withdrawal = 0;
        let deposit = 0;
        if (payload.sum < 0) {
            withdrawal = Math.abs(payload.sum);
        } else {
            deposit = payload.sum;
        }

        // Если категория не указана, предсказываем через ML
        let category = payload.category;
        if (!category) {
            try {
                const prediction = await this.mlService.predictCategory({
                    transactionDate: formattedDate,
                    withdrawal,
                    deposit,
                    refNo: v4(),
                    balance: user.balance,
                });
                category = prediction.category;
                this.logger.log(`Predicted category: ${category} for user ${userId}`);
            } catch (error) {
                this.logger.error(`Failed to predict category: ${error.message}`);
                category = 'Other'; // Значение по умолчанию
            }
        }

        // Рассчитываем новый баланс
        const newBalance = user.balance + payload.sum;

        // Создаем транзакцию
        const transaction = await super.create({
            userId,
            transactionDate: formattedDate,
            category,
            refNo: null,
            withdrawal,
            deposit,
            balance: newBalance,
        });

        // Обновляем баланс пользователя
        await this.userService.update(user, {
            balance: newBalance,
        });

        this.logger.log(
            `Transaction created: ID=${transaction.id}, User=${userId}, Balance updated to ${newBalance}`,
        );

        return transaction;
    }

    async getTransactionsGroupedByDate(options?: FindOptions): Promise<TransactionsResponse[]> {
        const transactions = await this.repository.findAll({
            ...options,
            order: [['transactionDate', 'DESC']],
            raw: false,
        });

        const groupedByDate = new Map<string, Transaction[]>();

        transactions.forEach(transaction => {
            const transactionDate =
                transaction.getDataValue('transactionDate') || transaction.transactionDate;
            if (!transactionDate) {
                return;
            }

            const dateStr =
                transactionDate instanceof Date
                    ? transactionDate.toISOString().split('T')[0]
                    : transactionDate.toString().split('T')[0];

            if (!groupedByDate.has(dateStr)) {
                groupedByDate.set(dateStr, []);
            }
            groupedByDate.get(dateStr)!.push(transaction);
        });

        const result: TransactionsResponse[] = [];

        groupedByDate.forEach((transactionsForDate, dateKey) => {
            let daySum: number = 0;

            const transactionResponses: TransactionResponse[] = transactionsForDate.map(
                transaction => {
                    const category =
                        transaction.getDataValue('category') || transaction.category || '';
                    const deposit =
                        parseFloat(transaction.getDataValue('deposit')?.toString() || '0') ||
                        (transaction.deposit ? parseFloat(transaction.deposit.toString()) : 0);
                    const withdrawal =
                        parseFloat(transaction.getDataValue('withdrawal')?.toString() || '0') ||
                        (transaction.withdrawal
                            ? parseFloat(transaction.withdrawal.toString())
                            : 0);

                    let sum: number;

                    if (deposit > 0) {
                        sum = deposit;
                        daySum += deposit;
                    } else if (withdrawal > 0) {
                        sum = -withdrawal;
                        daySum -= withdrawal;
                    } else {
                        sum = 0;
                    }

                    return {
                        category,
                        sum,
                    };
                },
            );

            result.push({
                date: new Date(dateKey),
                daySum,
                transaction: transactionResponses,
            });
        });

        return result.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async getTotalTransactions(
        userId: string,
        startDate: string,
        endDate: string,
    ): Promise<TotalTransactionResponse> {
        // Нормализуем даты (убираем время, если есть)
        const startDateStr = startDate.split('T')[0];
        const endDateStr = endDate.split('T')[0];

        const transactions = await this.repository.findAll({
            where: {
                userId,
                transactionDate: {
                    [Op.between]: [startDateStr, endDateStr],
                },
            },
            raw: false,
        });

        let income = 0;
        let expense = 0;

        transactions.forEach(transaction => {
            const deposit =
                parseFloat(transaction.getDataValue('deposit')?.toString() || '0') ||
                (transaction.deposit ? parseFloat(transaction.deposit.toString()) : 0);
            const withdrawal =
                parseFloat(transaction.getDataValue('withdrawal')?.toString() || '0') ||
                (transaction.withdrawal ? parseFloat(transaction.withdrawal.toString()) : 0);

            if (deposit > 0) {
                income += deposit;
            }
            if (withdrawal > 0) {
                expense += withdrawal;
            }
        });

        return {
            income: Math.round(income * 100) / 100,
            expense: Math.round(expense * 100) / 100,
        };
    }

    async getExpensesByMonth(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<Map<string, number>> {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const transactions = await this.repository.findAll({
            where: {
                userId,
                transactionDate: {
                    [Op.between]: [startDateStr, endDateStr],
                },
                withdrawal: {
                    [Op.gt]: 0,
                },
            },
            raw: false,
        });

        const monthlyExpenses = new Map<string, number>();

        transactions.forEach(transaction => {
            const transactionDate =
                transaction.getDataValue('transactionDate') || transaction.transactionDate;
            if (!transactionDate) {
                return;
            }

            const date =
                transactionDate instanceof Date ? transactionDate : new Date(transactionDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                2,
                '0',
            )}`;

            const withdrawal =
                parseFloat(transaction.getDataValue('withdrawal')?.toString() || '0') ||
                (transaction.withdrawal ? parseFloat(transaction.withdrawal.toString()) : 0);

            const current = monthlyExpenses.get(monthKey) || 0;
            monthlyExpenses.set(monthKey, current + withdrawal);
        });

        return monthlyExpenses;
    }

    async getMonthSummary(
        userId: string,
        year: number,
        month: number,
    ): Promise<{ income: number; expenses: number }> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const transactions = await this.repository.findAll({
            where: {
                userId,
                transactionDate: {
                    [Op.between]: [startDateStr, endDateStr],
                },
            },
            raw: false,
        });

        let income = 0;
        let expenses = 0;

        transactions.forEach(transaction => {
            const deposit =
                parseFloat(transaction.getDataValue('deposit')?.toString() || '0') ||
                (transaction.deposit ? parseFloat(transaction.deposit.toString()) : 0);
            const withdrawal =
                parseFloat(transaction.getDataValue('withdrawal')?.toString() || '0') ||
                (transaction.withdrawal ? parseFloat(transaction.withdrawal.toString()) : 0);

            if (deposit > 0) {
                income += deposit;
            }
            if (withdrawal > 0) {
                expenses += withdrawal;
            }
        });

        return {
            income: Math.round(income * 100) / 100,
            expenses: Math.round(expenses * 100) / 100,
        };
    }

    async getExpensesByCategoryForMonth(
        userId: string,
        year: number,
        month: number,
    ): Promise<Map<string, number>> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const transactions = await this.repository.findAll({
            where: {
                userId,
                transactionDate: {
                    [Op.between]: [startDateStr, endDateStr],
                },
                withdrawal: {
                    [Op.gt]: 0,
                },
            },
            raw: false,
        });

        const categoryExpenses = new Map<string, number>();

        transactions.forEach(transaction => {
            const category =
                transaction.getDataValue('category') || transaction.category || 'Без категории';

            const withdrawal =
                parseFloat(transaction.getDataValue('withdrawal')?.toString() || '0') ||
                (transaction.withdrawal ? parseFloat(transaction.withdrawal.toString()) : 0);

            const current = categoryExpenses.get(category) || 0;
            categoryExpenses.set(category, current + withdrawal);
        });

        return categoryExpenses;
    }

    async getWithdrawalsForMonthWithIds(
        userId: string,
        year: number,
        month: number,
    ): Promise<Array<{ id: number; category: string; amount: number }>> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const transactions = await this.repository.findAll({
            where: {
                userId,
                transactionDate: {
                    [Op.between]: [startDateStr, endDateStr],
                },
                withdrawal: {
                    [Op.gt]: 0,
                },
            },
            raw: false,
        });

        return transactions.map(transaction => {
            const category =
                transaction.getDataValue('category') || transaction.category || 'Без категории';
            const withdrawal =
                parseFloat(transaction.getDataValue('withdrawal')?.toString() || '0') ||
                (transaction.withdrawal ? parseFloat(transaction.withdrawal.toString()) : 0);

            return {
                id: transaction.id,
                category,
                amount: withdrawal,
            };
        });
    }

    getMonthName(monthIndex: number): { short: string; full: string } {
        const months = [
            { short: 'Янв', full: 'Январь' },
            { short: 'Фев', full: 'Февраль' },
            { short: 'Мар', full: 'Март' },
            { short: 'Апр', full: 'Апрель' },
            { short: 'Май', full: 'Май' },
            { short: 'Июн', full: 'Июнь' },
            { short: 'Июл', full: 'Июль' },
            { short: 'Авг', full: 'Август' },
            { short: 'Сен', full: 'Сентябрь' },
            { short: 'Окт', full: 'Октябрь' },
            { short: 'Ноя', full: 'Ноябрь' },
            { short: 'Дек', full: 'Декабрь' },
        ];
        return months[monthIndex];
    }

    async updateCategory(userId: number, transactionId: number, category: string): Promise<void> {
        const [affectedCount] = await this.repository.update(
            { category },
            {
                where: {
                    id: transactionId,
                    userId,
                },
            },
        );

        if (affectedCount === 0) {
            this.throwNotFoundException();
        }
    }
}
