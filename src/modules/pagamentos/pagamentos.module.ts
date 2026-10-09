import { Module } from '@nestjs/common';
import { FidelidadeModule } from '../fidelidade/fidelidade.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { PagamentosController } from './api/pagamentos.controller';
import { PagamentosService } from './application/pagamentos.service';
import { PAGAMENTO_GATEWAY } from './domain/pagamento.gateway';
import { PagamentoMockGateway } from './infrastructure/pagamento-mock.gateway';
import { PagamentosRepository } from './infrastructure/pagamentos.repository';

@Module({
  imports: [PedidosModule, FidelidadeModule],
  controllers: [PagamentosController],
  providers: [
    PagamentosService,
    PagamentosRepository,
    { provide: PAGAMENTO_GATEWAY, useClass: PagamentoMockGateway },
  ],
})
export class PagamentosModule {}
