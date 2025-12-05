import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { transactionProviders } from './transaction.providers';

@Module({
    providers: [TransactionService, ...transactionProviders],
    exports: [TransactionService],
})
export class TransactionModule {}
