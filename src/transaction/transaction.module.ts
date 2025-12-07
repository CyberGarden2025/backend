import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { transactionProviders } from './transaction.providers';
import { TransactionController } from './transaction.controller';
import { MLModule } from '../ml/ml.module';
import { UserModule } from '../user/user.module';
import { LimitModule } from 'src/limit/limit.module';

@Module({
    imports: [MLModule, UserModule, LimitModule],
    controllers: [TransactionController],
    providers: [TransactionService, ...transactionProviders],
    exports: [TransactionService],
})
export class TransactionModule {}
