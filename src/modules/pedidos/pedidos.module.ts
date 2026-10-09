import { Module } from '@nestjs/common';
import { EstoqueModule } from '../estoque/estoque.module';
import { FidelidadeModule } from '../fidelidade/fidelidade.module';
import { UnidadesModule } from '../unidades/unidades.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PedidosController } from './api/pedidos.controller';
import { PedidosService } from './application/pedidos.service';
import { PedidosRepository } from './infrastructure/pedidos.repository';

@Module({
  imports: [UnidadesModule, EstoqueModule, UsuariosModule, FidelidadeModule],
  controllers: [PedidosController],
  providers: [PedidosService, PedidosRepository],
  exports: [PedidosService],
})
export class PedidosModule {}
