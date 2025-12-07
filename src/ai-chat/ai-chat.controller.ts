import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConsumes,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { AIChatService } from './ai-chat.service';
import { EnqueueMessageDto } from './dto/enqueue-message.dto';
import { MessageFilterDto } from './dto/message-filters.dto';
import { MessageByIdQueryDto } from './dto/message-by-id.dto';
import { EnqueueMessageResponse } from './responses/enqueue-message.response';
import { MessagesListResponse, MessageResponse } from './responses/messages-list.response';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('messages')
@Controller('v1/messages')
@ApiBearerAuth('keycloak')
export class AIChatController {
    constructor(private readonly aiChatService: AIChatService) {}

    @Post('queue')
    @HttpCode(HttpStatus.OK)
    @ApiConsumes('application/x-www-form-urlencoded')
    @ApiOperation({ summary: 'Отправка сообщения в очередь' })
    @ApiBody({ type: EnqueueMessageDto })
    @ApiOkResponse({
        description: 'Сообщения добавлены в очередь',
        type: EnqueueMessageResponse,
    })
    @ApiBadRequestResponse({ description: 'Некорректные параметры запроса' })
    enqueueMessage(@Body() body: EnqueueMessageDto): Promise<EnqueueMessageResponse> {
        return this.aiChatService.enqueueMessage(body);
    }

    @Get()
    @ApiOperation({ summary: 'Получение списка сообщений с фильтрами и пагинацией' })
    @ApiOkResponse({
        description: 'Список сообщений пользователя',
        type: MessagesListResponse,
    })
    @ApiBadRequestResponse({ description: 'Некорректные параметры' })
    @ApiForbiddenResponse({ description: 'Нет доступа к указанному чату' })
    getMessages(@Query() filters: MessageFilterDto): MessagesListResponse {
        return this.aiChatService.getMessages(filters);
    }

    @Get(':message_id')
    @ApiOperation({ summary: 'Получение сообщения по ID' })
    @ApiParam({
        name: 'message_id',
        description: 'ID сообщения',
        example: '686da75d8767ad199b46dd3e',
    })
    @ApiOkResponse({
        description: 'Сообщение найдено',
        type: MessageResponse,
    })
    @ApiBadRequestResponse({ description: 'Некорректные параметры' })
    @ApiForbiddenResponse({ description: 'Нет доступа к указанному сообщению' })
    @ApiNotFoundResponse({ description: 'Сообщение не найдено' })
    getMessageById(
        @Param('message_id') messageId: string,
        @Query() query: MessageByIdQueryDto,
    ): MessageResponse {
        return this.aiChatService.getMessageById(messageId, query.user_uuid);
    }
}
