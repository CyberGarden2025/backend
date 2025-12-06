import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { transactionProviders } from './transaction.providers';
import { TransactionController } from './transaction.controller';
import { MLModule } from '../ml/ml.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [MLModule, UserModule],
    controllers: [TransactionController],
    providers: [TransactionService, ...transactionProviders],
    exports: [TransactionService],
})
export class TransactionModule {}
