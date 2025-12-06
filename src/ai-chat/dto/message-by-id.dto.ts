import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MessageByIdQueryDto {
    @ApiProperty({
        description: 'UUID пользователя',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    user_uuid!: string;
}
