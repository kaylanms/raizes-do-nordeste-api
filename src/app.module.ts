import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { FidelidadeModule } from './modules/fidelidade/fidelidade.module';
import { PagamentosModule } from './modules/pagamentos/pagamentos.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { AuthModule } from './modules/auth/auth.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuditModule } from './shared/audit/audit.module';
import { AllExceptionsFilter } from './shared/errors/all-exceptions.filter';
import { criarErroValidacao } from './shared/errors/validacao';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { HealthController } from './shared/health.controller';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    UsuariosModule,
    AuthModule,
    UnidadesModule,
    ProdutosModule,
    EstoqueModule,
    FidelidadeModule,
    PedidosModule,
    PagamentosModule,
    AuditoriaModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: criarErroValidacao,
      }),
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
