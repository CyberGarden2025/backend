import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsIn,
    IsISO8601,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Max,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export type OrderByField = 'created_at' | 'updated_at' | 'role';
export type OrderDirection = 'asc' | 'desc';

export enum MessageRole {
    User = 'user',
    Assistant = 'assistant',
    System = 'system',
    Tool = 'tool',
}

export class MessageFilterDto {
    @ApiProperty({
        description: 'UUID пользователя',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    user_uuid!: string;

    @ApiPropertyOptional({
        description: 'UUID чата для фильтрации',
        format: 'uuid',
        example: '760beced-f714-4151-8540-dc59c4671a4c',
    })
    @IsOptional()
    @IsUUID()
    chat_uuid?: string;

    @ApiPropertyOptional({
        description: 'Роль сообщения',
        enum: MessageRole,
    })
    @IsOptional()
    @IsIn(Object.values(MessageRole))
    role?: MessageRole;

    @ApiPropertyOptional({
        description: 'Поиск по содержимому (регистронезависимый)',
        minLength: 1,
        maxLength: 100,
        example: 'python',
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    content_search?: string;

    @ApiPropertyOptional({
        description: 'Начальная дата периода (ISO)',
        example: '2025-01-01T00:00:00Z',
        type: String,
    })
    @IsOptional()
    @IsString()
    @IsISO8601()
    date_from?: string;

    @ApiPropertyOptional({
        description: 'Конечная дата периода (ISO)',
        example: '2025-01-31T23:59:59Z',
        type: String,
    })
    @IsOptional()
    @IsString()
    @IsISO8601()
    date_to?: string;

    @ApiPropertyOptional({
        description: 'Фильтр по завершённости сообщения',
        type: Boolean,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    is_complete?: boolean;

    @ApiPropertyOptional({
        description: 'Номер страницы',
        default: 1,
        minimum: 1,
        maximum: 1000,
    })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(1000)
    page: number = 1;

    @ApiPropertyOptional({
        description: 'Количество сообщений на странице',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    page_size: number = 20;

    @ApiPropertyOptional({
        description: 'Поле для сортировки',
        enum: ['created_at', 'updated_at', 'role'],
        default: 'created_at',
    })
    @IsOptional()
    @IsIn(['created_at', 'updated_at', 'role'])
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
    order_by: OrderByField = 'created_at';

    @ApiPropertyOptional({
        description: 'Направление сортировки',
        enum: ['asc', 'desc'],
        default: 'desc',
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
    order_direction: OrderDirection = 'desc';
}
