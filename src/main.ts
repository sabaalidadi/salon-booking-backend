import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptors/transform/transform.interceptor.js';
import {
  UPLOADS_ROOT,
  UPLOADS_URL_PREFIX,
} from './common/storage/storage.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  // سرو‌کردن عکس‌های آپلودشده: http://localhost:3000/uploads/...
  app.useStaticAssets(UPLOADS_ROOT, {
    prefix: UPLOADS_URL_PREFIX,
    index: false, // لیست فایل‌های پوشه را نشان نده
    setHeaders: (res) => {
      // مرورگر را وادار کن فایل را همان‌طور که هست (عکس) تفسیر کند
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });

  await app.listen(Number(config.getOrThrow<number>('PORT')));
}

void bootstrap();