import { ApiProperty } from '@nestjs/swagger';

export class EnqueueMessageResponse {
    @ApiProperty({
        description: 'ID пользовательского сообщения',
        example: '686da75d8767ad199b46dd3d',
    })
    user_message_id!: string;

    @ApiProperty({
        description: 'ID сообщения ассистента',
        example: '686da75d8767ad199b46dd3e',
    })
    ai_message_id!: string;
}
