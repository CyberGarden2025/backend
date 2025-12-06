import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    const port = configService.get('BACKEND_PORT');
    const frontendHost = configService.get('FRONTEND_HOST');

    const config = new DocumentBuilder().setTitle('Banking API').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    app.enableCors({
        origin: `${frontendHost}`,
        credentials: true,
    });

    await app.listen(port || 3000);
}
bootstrap();
