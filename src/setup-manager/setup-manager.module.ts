import { Module } from '@nestjs/common';
import { SetupManagerService } from './setup-manager.service';
import { UserModule } from '../user/user.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
    imports: [TransactionModule, UserModule],
    providers: [SetupManagerService],
})
export class SetupManagerModule {}
