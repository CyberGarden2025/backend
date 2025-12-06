import { Inject, Injectable, Logger } from '@nestjs/common';
import { FindOptions, Op } from 'sequelize';

import { RepositoryService } from '../common/repository/repository.service';
import { ModelType } from '../common/repository/type/model-type';
import Transaction from './transaction.model';
import { TransactionsResponse, TransactionResponse } from './response/transaction.response';
import { TotalTransactionResponse } from './response/total-transaction.response';

@Injectable()
export class TransactionService extends RepositoryService<Transaction> {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        @Inject('TRANSACTIONS_REPOSITORY')
        protected repository: ModelType<Transaction>,
    ) {
        super(repository);
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
        userId: number,
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
}
