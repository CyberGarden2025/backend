import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BIQueryDto } from './dto/bi-query.dto';

export interface BIQueryRequest {
    question: string;
    max_rows?: number;
}

export interface BIQueryResponse {
    sql: string;
    rows: Array<Record<string, any>>;
    chart: {
        chart_type: string;
        x?: string;
        y?: string;
        series?: string;
        description?: string;
    };
}

@Injectable()
export class BIService {
    private readonly logger = new Logger(BIService.name);
    private readonly biServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.biServiceUrl = this.configService.get('BI_SERVICE_URL') || 'http://bi-service:8002';
    }

    async query(dto: BIQueryDto): Promise<BIQueryResponse> {
        const request: BIQueryRequest = {
            question: dto.question,
            max_rows: dto.maxRows,
        };
        try {
            const response = await firstValueFrom(
                this.httpService.post<BIQueryResponse>(`${this.biServiceUrl}/bi/query`, request),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to execute BI query: ${error.message}`);
            throw error;
        }
    }
}

