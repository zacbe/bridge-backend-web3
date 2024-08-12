import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = app.get(ConfigService).get('CORS_ORIGINS')?.split(',');
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Bridge API')
    .setDescription('API documentation for the Bridge service')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = app.get(ConfigService).get('PORT');
  await app.listen(port);
}
bootstrap();
