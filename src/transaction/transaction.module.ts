import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { transactionProviders } from './transaction.providers';
import { TransactionController } from './transaction.controller';

@Module({
    controllers: [TransactionController],
    providers: [TransactionService, ...transactionProviders],
    exports: [TransactionService],
})
export class TransactionModule {}
