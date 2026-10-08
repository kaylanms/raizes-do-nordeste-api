import { Module } from '@nestjs/common';
import { ProdutosModule } from '../produtos/produtos.module';
import { UnidadesModule } from '../unidades/unidades.module';
import { EstoqueController } from './api/estoque.controller';
import { EstoqueService } from './application/estoque.service';
import { EstoqueRepository } from './infrastructure/estoque.repository';

@Module({
  imports: [UnidadesModule, ProdutosModule],
  controllers: [EstoqueController],
  providers: [EstoqueService, EstoqueRepository],
  exports: [EstoqueRepository],
})
export class EstoqueModule {}
