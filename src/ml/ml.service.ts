import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ForecastDto } from './dto/forecast.dto';

export interface PredictRequest {
    transactionDate: string;
    refNo?: string;
    withdrawal: number;
    deposit: number;
    balance: number;
}

export interface PredictResponse {
    category: string;
    confidence: number;
}

interface ForecastRequest {
    userId: number;
    forecastMonths?: number;
}

@Injectable()
export class MLService {
    private readonly logger = new Logger(MLService.name);
    private readonly mlServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.mlServiceUrl = this.configService.get('ML_SERVICE_URL') || 'http://ml-service:8001';
    }

    async predictCategory(request: PredictRequest): Promise<PredictResponse> {
        try {
            const response = await firstValueFrom(
                this.httpService.post<PredictResponse>(`${this.mlServiceUrl}/predict`, request),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to predict category: ${error.message}`);
            throw error;
        }
    }

    async predictCategoriesBatch(requests: PredictRequest[]): Promise<PredictResponse[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.post<PredictResponse[]>(
                    `${this.mlServiceUrl}/predict/batch`,
                    requests,
                ),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to predict categories batch: ${error.message}`);
            throw error;
        }
    }

    async getFinancialForecast(userId: number, body?: ForecastDto): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.mlServiceUrl}/forecast`, {
                    userId,
                    forecastMonths: body?.forecastMonths,
                }),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get financial forecast: ${error.message}`);
            throw error;
        }
    }
}
