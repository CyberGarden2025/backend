import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
    @ApiProperty({
        description: 'Заголовок уведомления',
        example: 'Новое уведомление',
        minLength: 1,
        maxLength: 100,
    })
    @IsString({ message: 'Заголовок должен быть строкой' })
    @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
    title: string;

    @ApiProperty({
        description: 'Текст уведомления',
        example: 'У вас новое сообщение от пользователя Иван',
        minLength: 1,
        maxLength: 500,
    })
    @IsString({ message: 'Текст уведомления должен быть строкой' })
    @IsNotEmpty({ message: 'Текст уведомления не может быть пустым' })
    body: string;

    @ApiPropertyOptional({
        description: 'Дополнительные данные уведомления (для обработки на клиенте)',
        example: {
            type: 'new_message',
            messageId: '12345',
            userId: '67890',
            screen: 'chat',
            action: 'open_chat',
        },
        type: 'object',
        additionalProperties: { type: 'string' },
    })
    @IsOptional()
    @IsObject({ message: 'Данные должны быть объектом' })
    data?: Record<string, string>;
}
