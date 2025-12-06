import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class EnqueueMessageDto {
    @ApiProperty({
        description: 'Текст сообщения для отправки',
        example: 'Привет! Расскажи что-то интересное',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(8000)
    content!: string;

    @ApiProperty({
        description: 'UUID пользователя',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    user_uuid!: string;

    @ApiPropertyOptional({
        description: 'UUID чата',
        format: 'uuid',
        example: '760beced-f714-4151-8540-dc59c4671a4c',
    })
    @IsOptional()
    @IsUUID()
    chat_uuid?: string;
}
