import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors();

  // Register Global Exception Filter (RealWorld error format: { errors: { ... } })
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RealWorld Conduit API')
    .setDescription(
      'Medium clone backend API built with NestJS, TypeORM, Swagger, and i18n support.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Enter your JWT token (format: Bearer <token> or Token <token>)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Hello', 'Initial Hello World endpoint with internationalization')
    .addTag('Auth', 'Authentication and user registration')
    .addTag('User and Profile', 'Current user and user profiles operations')
    .addTag('Articles', 'Article CRUD and feed operations')
    .addTag('Comments', 'Article comments operations')
    .addTag('Favorites', 'Article favorites operations')
    .addTag('Tags', 'Article tags')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Conduit API Docs',
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

await bootstrap();
