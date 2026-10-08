import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.use((req: any, res: any, next: () => void) => {
    const id = String(req.headers['x-request-id'] ?? randomUUID());
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Raízes do Nordeste - API')
    .setDescription(
      'Back-end da rede Raízes do Nordeste: pedidos multicanal, estoque por unidade, pagamento mock e fidelidade.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const porta = process.env.PORT ?? 3000;
  await app.listen(porta);
  console.log(`API:     http://localhost:${porta}`);
  console.log(`Swagger: http://localhost:${porta}/docs`);
}
bootstrap();
