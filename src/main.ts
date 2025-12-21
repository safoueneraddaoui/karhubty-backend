import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for all origins (development) - restrict in production
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite default
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files (uploaded images)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Note: Global validation pipe disabled - no validation on any endpoint
  // Validation will only be applied to specific endpoints if needed

  // Note: Validation filter disabled - no validation error filtering

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('Karhubty API')
    .setDescription('Car rental platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  
  console.log(`🚀 Karhubty Backend is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs available at: http://localhost:${port}/api/docs`);
  console.log(`📁 Uploads available at: http://localhost:${port}/uploads/`);
}
bootstrap();