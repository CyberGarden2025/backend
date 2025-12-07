import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { TransactionService } from 'src/transaction/transaction.service';
import { UserService } from 'src/user/user.service';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

interface CsvTransaction {
    Date: string;
    Category: string;
    RefNo: string;
    Date2: string;
    Withdrawal: string;
    Deposit: string;
    Balance: string;
}

@Injectable()
export class SetupManagerService implements OnModuleInit {
    private readonly logger = new Logger(SetupManagerService.name);

    constructor(
        private readonly userService: UserService,
        private readonly transactionService: TransactionService,
    ) {}

    async onModuleInit() {
        await this.createDefaultUser();
    }

    async createDefaultUser() {
        const data = {
            email: 'admin@mail.ru',
            username: 'testUser',
            password: 'aeboba',
        };
        const user = await this.userService.findById(1).catch(() => null);

        if (!user) {
            const created = await this.userService.createUser(data).catch(err => {
                this.logger.warn(
                    `Default user already exists or cannot be created: ${err?.message}`,
                );
                return null;
            });
            if (!created) {
                return;
            }
            await this.createCsvTransactions(created.id);
        } else {
            this.logger.log(`User is found. Skipping create transactions (id=${user.id})`);
            await this.createCsvTransactions(user.id);
        }
    }

    async createCsvTransactions(userId: number) {
        try {
            const filePath = join(__dirname, '..', '..', 'data', 'ci_data.csv');

            const fileContent = readFileSync(filePath, 'utf-8');

            const lines = fileContent.split('\n');

            const firstDataLine = lines.find(
                line => line.trim().length > 0 && !line.includes('Date\tCategory'),
            );
            const delimiter = firstDataLine && firstDataLine.includes('\t') ? '\t' : ',';

            const dataLines = lines.slice(2).filter(line => line.trim().length > 0);
            const csvData = dataLines.join('\n');

            const records: CsvTransaction[] = parse(csvData, {
                delimiter: delimiter,
                columns: ['Date', 'Category', 'RefNo', 'Date2', 'Withdrawal', 'Deposit', 'Balance'],
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
            });

            // Находим пользователя для привязки транзакций
            this.logger.log(`Using user id=${userId} for CSV import`);

            let createdCount = 0;
            let errorCount = 0;

            for (const record of records) {
                try {
                    if (!record.Date || !record.Category) {
                        this.logger.warn('Skipping invalid record:', record);
                        errorCount++;
                        continue;
                    }

                    const transactionData = {
                        transactionDate: this.parseDate(record.Date),
                        category: record.Category,
                        refNo: record.RefNo,
                        withdrawal: this.parseNumber(record.Withdrawal),
                        deposit: this.parseNumber(record.Deposit),
                        balance: this.parseNumber(record.Balance),
                        userId,
                    };

                    await this.transactionService.create(transactionData);
                    createdCount++;
                } catch (error) {
                    this.logger.error(`Error creating transaction: ${error.message}`, record);
                    errorCount++;
                }
            }

            this.logger.log(`CSV import completed: ${createdCount} created, ${errorCount} errors`);
            await this.userService.update(userId, {
                balance: this.parseNumber(records.at(-1)!.Balance),
            });
        } catch (error) {
            this.logger.error(`Error reading CSV file: ${error.message}`);
            this.logger.error('Stack trace:', error.stack);
        }
    }

    private parseDate(dateString: string): Date {
        if (!dateString || dateString.trim() === '') {
            return new Date();
        }

        const parts = dateString.split('/').map(part => part.trim());

        if (parts.length !== 3) {
            this.logger.warn(`Invalid date format: ${dateString}`);
            return new Date();
        }

        let month: number;
        let day: number;
        let year: number;

        // Определяем формат по длине года
        if (parts[2].length === 4) {
            // Формат "M/D/YYYY" или "MM/DD/YYYY"
            month = parseInt(parts[0]);
            day = parseInt(parts[1]);
            year = parseInt(parts[2]);
        } else if (parts[2].length === 2) {
            // Формат "DD/MM/YY"
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
            const twoDigitYear = parseInt(parts[2]);

            // Если год меньше 50, считаем его 2000-м, иначе 1900-м
            year = twoDigitYear < 50 ? 2000 + twoDigitYear : 1900 + twoDigitYear;
        } else {
            this.logger.warn(`Unknown date format: ${dateString}`);
            return new Date();
        }

        // Проверяем валидность даты
        if (isNaN(month) || isNaN(day) || isNaN(year)) {
            this.logger.warn(`Invalid date values: ${dateString}`);
            return new Date();
        }

        const date = new Date(year, month - 1, day);

        // Проверяем, что дата была корректно создана
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            this.logger.warn(`Invalid date: ${dateString}, parsed as: ${date.toISOString()}`);
        }

        return date;
    }

    private parseNumber(value: string): number {
        if (!value || value.trim() === '' || value === '0') {
            return 0;
        }

        // Убираем запятые и преобразуем научную нотацию
        let cleanValue = value.replace(/,/g, '');

        // Обработка научной нотации (например, "3.00E+11")
        if (cleanValue.includes('E')) {
            return parseFloat(cleanValue);
        }

        const num = parseFloat(cleanValue);
        return isNaN(num) ? 0 : num;
    }
}
