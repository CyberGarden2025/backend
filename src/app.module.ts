import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { SetupManagerModule } from './setup-manager/setup-manager.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { FirebaseModule } from './notification/firebase/firebase.module';
import { NotificationModule } from './notification/notification.module';
import { MLModule } from './ml/ml.module';
import { BIModule } from './bi/bi.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        FirebaseModule,
        NotificationModule,
        UserModule,
        TransactionModule,
        SetupManagerModule,
        MLModule,
        BIModule,
    ],
})
export class AppModule {}
