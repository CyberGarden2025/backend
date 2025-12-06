import { ApiProperty } from '@nestjs/swagger';
import { MessageRole } from '../dto/message-filters.dto';

export class MessageResponse {
    @ApiProperty({ example: '686da75d8767ad199b46dd3e' })
    id!: string;

    @ApiProperty({
        description: 'UUID чата',
        example: '760beced-f714-4151-8540-dc59c4671a4c',
    })
    chat_uuid!: string;

    @ApiProperty({
        description: 'UUID пользователя',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    user_uuid!: string;

    @ApiProperty({
        description: 'Роль сообщения',
        enum: MessageRole,
        example: MessageRole.Assistant,
    })
    role!: MessageRole;

    @ApiProperty({
        description: 'Содержимое сообщения',
        example: 'Полный ответ ИИ...',
    })
    content!: string;

    @ApiProperty({ description: 'Признак завершенности', example: true })
    is_complete!: boolean;

    @ApiProperty({
        description: 'Дата создания',
        example: '2025-07-08T23:18:53.865Z',
    })
    created_at!: string;

    @ApiProperty({
        description: 'Дата обновления',
        example: '2025-07-08T23:18:58.222Z',
    })
    updated_at!: string;
}

export class AppliedFiltersResponse {
    @ApiProperty({
        description: 'UUID пользователя',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    user_uuid!: string;

    @ApiProperty({ required: false, example: '760beced-f714-4151-8540-dc59c4671a4c' })
    chat_uuid?: string;

    @ApiProperty({ required: false, enum: MessageRole, example: MessageRole.Assistant })
    role?: MessageRole;

    @ApiProperty({ required: false, example: 'python' })
    content_search?: string;

    @ApiProperty({ required: false, example: '2025-01-01T00:00:00Z' })
    date_from?: string;

    @ApiProperty({ required: false, example: '2025-01-31T23:59:59Z' })
    date_to?: string;

    @ApiProperty({ required: false, example: true })
    is_complete?: boolean;

    @ApiProperty({ required: false, example: 'created_at' })
    order_by?: string;

    @ApiProperty({ required: false, example: 'desc' })
    order_direction?: string;
}

export class ListMetadataResponse {
    @ApiProperty({ description: 'Всего сообщений', example: 150 })
    total_count!: number;

    @ApiProperty({ description: 'Текущая страница', example: 1 })
    page!: number;

    @ApiProperty({ description: 'Размер страницы', example: 20 })
    page_size!: number;

    @ApiProperty({ description: 'Всего страниц', example: 8 })
    total_pages!: number;

    @ApiProperty({ description: 'Есть ли следующая страница', example: true })
    has_next!: boolean;

    @ApiProperty({ description: 'Есть ли предыдущая страница', example: false })
    has_previous!: boolean;

    @ApiProperty({ description: 'Применённые фильтры', type: AppliedFiltersResponse })
    applied_filters!: AppliedFiltersResponse;
}

export class MessagesListResponse {
    @ApiProperty({ type: [MessageResponse] })
    messages!: MessageResponse[];

    @ApiProperty({ type: ListMetadataResponse })
    metadata!: ListMetadataResponse;
}
