import { Body, Controller, Get, Post } from '@nestjs/common';
import { LimitService } from './limit.service';
import { CreateLimitDto } from './dto/create-limit.dto';
import { LimitResponse } from './response/limit.response';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('limits')
export class LimitController {
    constructor(private readonly service: LimitService) {}

    @Post()
    @ApiOkResponse({
        description: 'Создание лимита для категорий',
        type: LimitResponse,
    })
    async createLimit(@Body() body: CreateLimitDto) {
        await this.service.create({
            ...body,
            userId: 1,
        });
    }

    @Get()
    @ApiOkResponse({
        description: 'Список лимитов для категорий',
        type: [LimitResponse],
    })
    async findAll() {
        return this.service.findAll({
            where: {
                userId: 1,
            },
        });
    }
}
