import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BIService, BIQueryResponse, BIChatResponse, BISuggestedQuery } from './bi.service';
import { BIQueryDto } from './dto/bi-query.dto';

@ApiTags('bi')
@Controller('bi')
export class BIController {
    constructor(private readonly biService: BIService) {}

    @Post('query')
    @ApiOperation({ summary: 'Выполнить запрос к БД на естественном языке' })
    @ApiResponse({ status: 200, description: 'Запрос выполнен успешно' })
    async query(@Body() body: BIQueryDto): Promise<BIQueryResponse> {
        return this.biService.query(body);
    }

    @Get('chat/presets')
    @ApiOperation({ summary: 'Получить базовые кнопки/подсказки для BI-чата' })
    async chatPresets(): Promise<BISuggestedQuery[]> {
        return this.biService.chatPresets();
    }

    @Post('chat')
    @ApiOperation({ summary: 'BI-чат: ответ + данные + подсказки' })
    async chat(@Body() body: { question?: string; maxRows?: number }): Promise<BIChatResponse> {
        return this.biService.chat(body);
    }
}

