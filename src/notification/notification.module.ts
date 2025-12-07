import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { UserModule } from 'src/user/user.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { MLModule } from 'src/ml/ml.module';

@Module({
    imports: [UserModule, TransactionModule, MLModule],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
