import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { EnqueueMessageDto } from './dto/enqueue-message.dto';
import {
    MessageFilterDto,
    MessageRole,
    OrderByField,
    OrderDirection,
} from './dto/message-filters.dto';
import { EnqueueMessageResponse } from './responses/enqueue-message.response';
import {
    AppliedFiltersResponse,
    MessageResponse,
    MessagesListResponse,
} from './responses/messages-list.response';

interface ChatMessage {
    id: string;
    chat_uuid: string;
    user_uuid: string;
    role: MessageRole;
    content: string;
    is_complete: boolean;
    created_at: Date;
    updated_at: Date;
}

interface LdrStartResponse {
    status?: string;
    research_id?: string;
    queue_position?: number;
    message?: string;
}

interface LdrStatusResponse {
    status?: string;
    progress?: number;
    metadata?: Record<string, any>;
    error?: string;
}

@Injectable()
export class AIChatService {
    private readonly logger = new Logger(AIChatService.name);
    private messages: ChatMessage[] = [];
    private readonly ldrClient: AxiosInstance;
    private readonly ldrBaseUrl: string;
    private readonly ldrUsername: string | undefined;
    private readonly ldrPassword: string | undefined;
    private readonly ldrModel: string;
    private readonly ldrPollTimeoutMs: number;
    private readonly ldrPollIntervalMs: number;

    constructor() {
        this.ldrBaseUrl = process.env.LDR_BASE_URL ?? 'http://localhost:5731';
        this.ldrUsername = process.env.LDR_USERNAME;
        this.ldrPassword = process.env.LDR_PASSWORD;
        this.ldrModel = process.env.LDR_MODEL ?? 'gpt-oss:20b';
        this.ldrPollIntervalMs = Math.max(
            1000,
            Number(process.env.LDR_POLL_INTERVAL_MS ?? 5_000),
        );
        this.ldrPollTimeoutMs = Math.max(
            60_000,
            Number(process.env.LDR_POLL_TIMEOUT_MS ?? 3 * 60 * 60 * 1000), // default 3 hours
        );
        this.ldrClient = axios.create({
            baseURL: this.ldrBaseUrl,
            timeout: 30_000,
            validateStatus: () => true,
        });

        this.seedMessages();
    }

    async enqueueMessage(dto: EnqueueMessageDto): Promise<EnqueueMessageResponse> {
        const content = dto.content.trim();
        if (!content) {
            throw new BadRequestException('content should not be empty');
        }

        const now = new Date();
        const chatUuid = dto.chat_uuid ?? randomUUID();
        const userMessageId = this.generateMessageId();
        const aiMessageId = this.generateMessageId();

        this.messages.push({
            id: userMessageId,
            chat_uuid: chatUuid,
            user_uuid: dto.user_uuid,
            role: MessageRole.User,
            content,
            is_complete: true,
            created_at: now,
            updated_at: now,
        });

        this.messages.push({
            id: aiMessageId,
            chat_uuid: chatUuid,
            user_uuid: dto.user_uuid,
            role: MessageRole.Assistant,
            content: '',
            is_complete: false,
            created_at: now,
            updated_at: now,
        });

        // Kick off LDR request asynchronously
        this.fetchFromLdr(aiMessageId, content).catch(err => {
            this.logger.error(`LDR request failed: ${err instanceof Error ? err.message : err}`);
            this.updateMessage(aiMessageId, `LDR error: ${err instanceof Error ? err.message : 'unknown'}`, true);
        });

        return {
            user_message_id: userMessageId,
            ai_message_id: aiMessageId,
        };
    }

    getMessages(filters: MessageFilterDto): MessagesListResponse {
        const dateFrom = filters.date_from ? new Date(filters.date_from) : undefined;
        const dateTo = filters.date_to ? new Date(filters.date_to) : undefined;

        if (dateFrom && dateTo && dateFrom > dateTo) {
            throw new BadRequestException('date_from must be earlier than or equal to date_to');
        }

        if (filters.chat_uuid) {
            const chatMessages = this.messages.filter(m => m.chat_uuid === filters.chat_uuid);
            if (chatMessages.length > 0 && !chatMessages.some(m => m.user_uuid === filters.user_uuid)) {
                throw new ForbiddenException('No access to the specified chat');
            }
        }

        let filtered = this.messages.filter(m => m.user_uuid === filters.user_uuid);

        if (filters.chat_uuid) {
            filtered = filtered.filter(m => m.chat_uuid === filters.chat_uuid);
        }

        if (filters.role) {
            filtered = filtered.filter(m => m.role === filters.role);
        }

        if (filters.is_complete !== undefined) {
            filtered = filtered.filter(m => m.is_complete === filters.is_complete);
        }

        if (filters.content_search) {
            const search = filters.content_search.toLowerCase();
            filtered = filtered.filter(m => m.content.toLowerCase().includes(search));
        }

        if (dateFrom) {
            filtered = filtered.filter(m => m.created_at >= dateFrom);
        }

        if (dateTo) {
            filtered = filtered.filter(m => m.created_at <= dateTo);
        }

        filtered = this.sortMessages(filtered, filters.order_by, filters.order_direction);

        const totalCount = filtered.length;
        const page = filters.page ?? 1;
        const pageSize = filters.page_size ?? 20;
        const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageItems = filtered.slice(start, end);

        const appliedFilters = this.extractAppliedFilters(filters);

        return {
            messages: pageItems.map(m => this.toResponse(m)),
            metadata: {
                total_count: totalCount,
                page,
                page_size: pageSize,
                total_pages: totalPages,
                has_next: page < totalPages,
                has_previous: page > 1 && totalPages > 0,
                applied_filters: appliedFilters,
            },
        };
    }

    getMessageById(messageId: string, userUuid: string): MessageResponse {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.user_uuid !== userUuid) {
            throw new ForbiddenException('No access to the requested message');
        }

        return this.toResponse(message);
    }

    private sortMessages(
        messages: ChatMessage[],
        orderBy: OrderByField,
        direction: OrderDirection,
    ): ChatMessage[] {
        const orderField = orderBy ?? 'created_at';
        const orderDirection = direction ?? 'desc';
        const factor = orderDirection === 'asc' ? 1 : -1;

        return [...messages].sort((a, b) => {
            if (orderField === 'role') {
                return a.role.localeCompare(b.role) * factor;
            }
            if (orderField === 'updated_at') {
                return (a.updated_at.getTime() - b.updated_at.getTime()) * factor;
            }
            return (a.created_at.getTime() - b.created_at.getTime()) * factor;
        });
    }

    private extractAppliedFilters(filters: MessageFilterDto): AppliedFiltersResponse {
        const applied: AppliedFiltersResponse = {
            user_uuid: filters.user_uuid,
        };

        if (filters.chat_uuid) {
            applied.chat_uuid = filters.chat_uuid;
        }
        if (filters.role) {
            applied.role = filters.role;
        }
        if (filters.content_search) {
            applied.content_search = filters.content_search;
        }
        if (filters.date_from) {
            applied.date_from = filters.date_from;
        }
        if (filters.date_to) {
            applied.date_to = filters.date_to;
        }
        if (filters.is_complete !== undefined) {
            applied.is_complete = filters.is_complete;
        }

        applied.order_by = filters.order_by ?? 'created_at';
        applied.order_direction = filters.order_direction ?? 'desc';

        return applied;
    }

    private toResponse(message: ChatMessage): MessageResponse {
        return {
            id: message.id,
            chat_uuid: message.chat_uuid,
            user_uuid: message.user_uuid,
            role: message.role,
            content: message.content,
            is_complete: message.is_complete,
            created_at: message.created_at.toISOString(),
            updated_at: message.updated_at.toISOString(),
        };
    }

    private generateMessageId(): string {
        return randomBytes(12).toString('hex');
    }

    private updateMessage(messageId: string, content: string, isComplete: boolean): void {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) {
            return;
        }
        message.content = content;
        message.is_complete = isComplete;
        message.updated_at = new Date();
    }

    private async fetchFromLdr(aiMessageId: string, query: string): Promise<void> {
        if (!this.ldrUsername || !this.ldrPassword) {
            this.updateMessage(
                aiMessageId,
                'LDR credentials are not configured (set LDR_USERNAME and LDR_PASSWORD).',
                true,
            );
            return;
        }

        const cookieJar = new Map<string, string>();

        const addCookies = (setCookie?: string[] | string): void => {
            if (!setCookie) return;
            const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
            for (const c of entries) {
                const trimmed = c.split(';')[0];
                if (!trimmed) continue;
                const [name, value] = trimmed.split('=');
                if (!name) continue;
                cookieJar.set(name, value);
            }
        };

        const cookieHeader = (): string | undefined => {
            if (!cookieJar.size) return undefined;
            return Array.from(cookieJar.entries())
                .map(([k, v]) => `${k}=${v}`)
                .join('; ');
        };

        const extractCsrfFromHtml = (html: string): string | null => {
            const match = html.match(/name=["']csrf_token["']\s+value=["']([^"']+)/i);
            return match ? match[1] : null;
        };

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. Get login page to obtain CSRF and initial cookies
        const loginPage = await this.ldrClient.get('/auth/login');
        addCookies(loginPage.headers['set-cookie'] as any);

        const loginCsrf = typeof loginPage.data === 'string' ? extractCsrfFromHtml(loginPage.data) : null;
        if (!loginCsrf) {
            throw new Error('Unable to obtain CSRF token from LDR login page');
        }

        // 2. Login
        const form = new URLSearchParams();
        form.append('username', this.ldrUsername);
        form.append('password', this.ldrPassword);
        form.append('csrf_token', loginCsrf);

        const loginResp = await this.ldrClient.post('/auth/login', form.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Cookie: cookieHeader(),
            },
            maxRedirects: 0,
        });
        addCookies(loginResp.headers['set-cookie'] as any);
        if (![200, 302].includes(loginResp.status)) {
            throw new Error(`LDR login failed with status ${loginResp.status}`);
        }

        // 3. Get CSRF token for API requests
        const csrfResp = await this.ldrClient.get('/auth/csrf-token', {
            headers: { Cookie: cookieHeader() },
        });
        addCookies(csrfResp.headers['set-cookie'] as any);
        const apiCsrf = csrfResp.data?.csrf_token;
        if (!apiCsrf) {
            throw new Error('Unable to obtain API CSRF token from LDR');
        }

        const headers = {
            Cookie: cookieHeader(),
            'X-CSRF-Token': apiCsrf,
        };

        // 4. Start research
        const startResp = await this.ldrClient.post<LdrStartResponse>(
            '/api/start_research',
            {
                query,
                model: this.ldrModel,
                search_engines: ['searxng'],
                iterations: 1,
            },
            { headers },
        );

        if (startResp.status === 401) {
            this.logger.warn(
                `LDR start_research returned 401. Body: ${JSON.stringify(startResp.data).slice(0, 300)}`,
            );
            throw new Error('LDR returned 401 on start_research (check LDR_USERNAME/LDR_PASSWORD)');
        }

        const researchId = startResp.data?.research_id;
        if (!researchId) {
            throw new Error(`LDR start_research failed: ${startResp.status} ${startResp.data?.message ?? ''}`);
        }

        // 5. Poll status
        let completed = false;
        let finalStatus: string | undefined;
        let lastError: string | undefined;

        const startedAt = Date.now();
        while (Date.now() - startedAt < this.ldrPollTimeoutMs) {
            await sleep(this.ldrPollIntervalMs);
            const statusResp = await this.ldrClient.get<LdrStatusResponse>(
                `/api/research/${researchId}/status`,
                { headers },
            );

            finalStatus = statusResp.data?.status;
            if (finalStatus === 'completed') {
                completed = true;
                break;
            }
            if (
                finalStatus === 'failed' ||
                finalStatus === 'error' ||
                finalStatus === 'suspended'
            ) {
                lastError =
                    statusResp.data?.metadata?.error ||
                    statusResp.data?.error ||
                    'LDR research failed';
                break;
            }
        }

        if (!completed) {
            const waitedMinutes = Math.round((Date.now() - startedAt) / 60000);
            throw new Error(
                lastError ||
                    `LDR research not completed after ${waitedMinutes} minutes (status: ${finalStatus ?? 'unknown'})`,
            );
        }

        // 6. Fetch report
        const reportResp = await this.ldrClient.get<{ content?: string }>(`/api/report/${researchId}`, {
            headers,
        });

        const content = reportResp.data?.content;
        if (!content) {
            throw new Error('LDR report is empty');
        }

        this.updateMessage(aiMessageId, content, true);
    }

    private seedMessages(): void {
        this.messages = [
            {
                id: '686da75d8767ad199b46dd3d',
                chat_uuid: '760beced-f714-4151-8540-dc59c4671a4c',
                user_uuid: '123e4567-e89b-12d3-a456-426614174000',
                role: MessageRole.User,
                content: 'Tell me something interesting.',
                is_complete: true,
                created_at: new Date('2025-07-08T23:18:53.000Z'),
                updated_at: new Date('2025-07-08T23:18:53.000Z'),
            },
            {
                id: '686da75d8767ad199b46dd3e',
                chat_uuid: '760beced-f714-4151-8540-dc59c4671a4c',
                user_uuid: '123e4567-e89b-12d3-a456-426614174000',
                role: MessageRole.Assistant,
                content: 'A concise AI response for the requested topic.',
                is_complete: true,
                created_at: new Date('2025-07-08T23:18:53.865Z'),
                updated_at: new Date('2025-07-08T23:18:58.222Z'),
            },
            {
                id: '686da75d8767ad199b46dd3f',
                chat_uuid: '760beced-f714-4151-8540-dc59c4671a4c',
                user_uuid: '123e4567-e89b-12d3-a456-426614174000',
                role: MessageRole.Assistant,
                content: 'Draft answer that is still being completed.',
                is_complete: false,
                created_at: new Date('2025-07-08T23:20:00.000Z'),
                updated_at: new Date('2025-07-08T23:20:58.222Z'),
            },
            {
                id: 'b4c4e64a9f6c4c0f8eaa0b21',
                chat_uuid: '11111111-1111-1111-1111-111111111111',
                user_uuid: '223e4567-e89b-12d3-a456-426614174999',
                role: MessageRole.Assistant,
                content: 'Other user assistant message.',
                is_complete: true,
                created_at: new Date('2025-07-09T10:00:00.000Z'),
                updated_at: new Date('2025-07-09T10:05:00.000Z'),
            },
        ];
    }
}
