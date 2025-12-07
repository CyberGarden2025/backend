import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFcmTokenDto {
    @ApiProperty({
        description: 'Fcm токен',
    })
    @IsString({ message: 'Токен должен быть строкой' })
    fcmToken: string;
}
