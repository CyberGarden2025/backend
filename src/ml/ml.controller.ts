import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MLService, PredictResponse } from './ml.service';
import { PredictDto } from './dto/predict.dto';

@ApiTags('ml')
@ApiBearerAuth('keycloak')
@Controller('ml')
export class MLController {
    constructor(private readonly mlService: MLService) {}

    @Post('predict')
    @ApiOperation({ summary: 'Предсказать категорию транзакции' })
    @ApiResponse({ status: 200, description: 'Категория предсказана успешно' })
    async predictCategory(@Body() body: PredictDto): Promise<PredictResponse> {
        return this.mlService.predictCategory(body);
    }

    @Post('predict/batch')
    @ApiOperation({ summary: 'Предсказать категории для нескольких транзакций' })
    async predictCategoriesBatch(
        @Body()
        body: Array<{
            transactionDate: string;
            refNo?: string;
            withdrawal: number;
            deposit: number;
            balance: number;
        }>,
    ): Promise<PredictResponse[]> {
        return this.mlService.predictCategoriesBatch(body);
    }

    @Post('forecast/:userId')
    @ApiOperation({ summary: 'Получить финансовый прогноз для пользователя' })
    async getFinancialForecast(
        @Param('userId', ParseIntPipe) userId: number,
        @Body()
        body: {
            transactions: Array<{
                transactionDate: string;
                category: string;
                refNo?: string;
                withdrawal: number;
                deposit: number;
                balance: number;
            }>;
            currentBalance: number;
            forecastMonths?: number;
        },
    ) {
        return this.mlService.getFinancialForecast({
            userId,
            ...body,
        });
    }
}
