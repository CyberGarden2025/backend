import './instrument';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    const port = configService.get('BACKEND_PORT');
    const frontendHost = configService.get('FRONTEND_HOST');
    const normalizeOrigin = (origin: string) => {
        if (!origin) return null;
        const trimmed = origin.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        return `http://${trimmed}`;
    };

    const allowedOrigins = frontendHost
        ?.split(',')
        .map(normalizeOrigin)
        .filter((origin): origin is string => Boolean(origin)) || ['http://localhost:4200'];
    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
        .setTitle('Banking API')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
            'keycloak',
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.useGlobalInterceptors(new LoggingInterceptor());

    SwaggerModule.setup('api-docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: 'Banking API Documentation',
    });

    app.enableCors({
        origin: frontendHost || 'http://localhost:4200',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await app.listen(port || 3000);
}
bootstrap();
