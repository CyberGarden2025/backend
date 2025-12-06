import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BIService, BIQueryResponse } from './bi.service';
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
}

