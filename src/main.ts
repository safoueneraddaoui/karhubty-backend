import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for React frontend
  app.enableCors({
    origin: 'http://localhost:3000', // React app URL
    credentials: true,
  });

  // Serve static files (uploaded images)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 8080;
  await app.listen(port);
  
  console.log(`🚀 Karhubty Backend is running on: http://localhost:${port}/api`);
  console.log(`📁 Uploads available at: http://localhost:${port}/uploads/`);
}
bootstrap();