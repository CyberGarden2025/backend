import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('BACKEND_PORT');
  const frontendHost = configService.get('FRONTEND_HOST');

  app.enableCors({
    origin: `${frontendHost}`,
    credentials: true,
  });
  app.setGlobalPrefix('/api');


  await app.listen(port);
}
bootstrap();
