import { Module } from '@nestjs/common';
import { LimitService } from './limit.service';
import { limitsProviders } from './limit.providers';
import { LimitController } from './limit.controller';

@Module({
    providers: [LimitService, ...limitsProviders],
    exports: [LimitService],
    controllers: [LimitController],
})
export class LimitModule {}
