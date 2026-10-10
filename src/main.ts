import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { ErroPadraoDto } from './shared/errors/erro-padrao.dto';

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
  const doc = SwaggerModule.createDocument(app, config, {
    extraModels: [ErroPadraoDto],
  });
  const ref = { $ref: '#/components/schemas/ErroPadraoDto' };
  const resposta = (descricao: string) => ({
    description: descricao,
    content: { 'application/json': { schema: ref } },
  });

  for (const item of Object.values(doc.paths)) {
    for (const op of Object.values(item) as any[]) {
      if (!op || typeof op !== 'object' || Array.isArray(op)) continue;
      if (!op.responses) op.responses = {};
      if (op.security?.length && !op.responses['401'])
        op.responses['401'] = resposta('Não autenticado');
      const temEntrada =
        op.requestBody || op.parameters?.some((p: any) => p.in === 'query');
      if (temEntrada && !op.responses['422'])
        op.responses['422'] = resposta('Erro de validação dos dados');
    }
  }

  SwaggerModule.setup('docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });

  const porta = process.env.PORT ?? 3000;
  await app.listen(porta);
  console.log(`API:     http://localhost:${porta}`);
  console.log(`Swagger: http://localhost:${porta}/docs`);
}
bootstrap();
