import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AIChatModule } from '../src/ai-chat/ai-chat.module';

describe('AIChatModule (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AIChatModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('enqueues message and makes it available in list', async () => {
        const userUuid = '123e4567-e89b-12d3-a456-426614174000';
        const enqueueResponse = await request(app.getHttpServer())
            .post('/api/v1/messages/queue')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send(`content=Hello+from+test&user_uuid=${userUuid}`)
            .expect(200);

        expect(enqueueResponse.body.user_message_id).toBeDefined();
        expect(enqueueResponse.body.ai_message_id).toBeDefined();

        const listResponse = await request(app.getHttpServer())
            .get(
                `/api/v1/messages/?user_uuid=${userUuid}&page=1&page_size=5&order_by=created_at&order_direction=desc`,
            )
            .expect(200);

        const messageIds = listResponse.body.messages.map((m: any) => m.id);
        expect(messageIds).toContain(enqueueResponse.body.user_message_id);
    });

    it('rejects invalid pagination parameters', async () => {
        const userUuid = '123e4567-e89b-12d3-a456-426614174000';
        await request(app.getHttpServer())
            .get(`/api/v1/messages/?user_uuid=${userUuid}&page_size=500`)
            .expect(400);
    });

    it('respects per-message access control', async () => {
        const userUuid = '123e4567-e89b-12d3-a456-426614174000';
        const otherUserUuid = '223e4567-e89b-12d3-a456-426614174999';

        const ownMessages = await request(app.getHttpServer())
            .get(`/api/v1/messages/?user_uuid=${userUuid}&page_size=1`)
            .expect(200);
        const ownMessageId = ownMessages.body.messages[0].id;

        await request(app.getHttpServer())
            .get(`/api/v1/messages/${ownMessageId}?user_uuid=${userUuid}`)
            .expect(200);

        await request(app.getHttpServer())
            .get(`/api/v1/messages/${ownMessageId}?user_uuid=${otherUserUuid}`)
            .expect(403);
    });
});
