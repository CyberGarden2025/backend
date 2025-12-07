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

export interface BISuggestedQuery {
    label: string;
    question: string;
}

export interface BIChatRequest {
    question?: string;
    maxRows?: number;
}

export interface BIChatResponse {
    answer: string;
    sql?: string;
    rows: Array<Record<string, any>>;
    chart?: BIQueryResponse['chart'];
    suggested_queries: BISuggestedQuery[];
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

    async chat(body: BIChatRequest): Promise<BIChatResponse> {
        try {
            const response = await firstValueFrom(
                this.httpService.post<BIChatResponse>(`${this.biServiceUrl}/bi/chat`, {
                    question: body.question,
                    max_rows: body.maxRows,
                }),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to execute BI chat: ${error.message}`);
            throw error;
        }
    }

    async chatPresets(): Promise<BISuggestedQuery[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<BISuggestedQuery[]>(`${this.biServiceUrl}/bi/chat/presets`),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to load BI chat presets: ${error.message}`);
            throw error;
        }
    }
}

