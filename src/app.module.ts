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
import { AIChatModule } from './ai-chat/ai-chat.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { LimitModule } from './limit/limit.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        SentryModule.forRoot(),
        DatabaseModule,
        FirebaseModule,
        NotificationModule,
        UserModule,
        TransactionModule,
        SetupManagerModule,
        LimitModule,
        MLModule,
        BIModule,
        AIChatModule,
        DiagnosticsModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: SentryGlobalFilter,
        },
    ],
})
export class AppModule {}
