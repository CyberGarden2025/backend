import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BIService } from './bi.service';
import { BIController } from './bi.controller';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [BIController],
    providers: [BIService],
    exports: [BIService],
})
export class BIModule {}

