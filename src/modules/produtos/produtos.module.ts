import { Module } from '@nestjs/common';
import { UnidadesModule } from '../unidades/unidades.module';
import { CardapioController } from './api/cardapio.controller';
import { ProdutosController } from './api/produtos.controller';
import { CardapioService } from './application/cardapio.service';
import { ProdutosService } from './application/produtos.service';
import { CardapioRepository } from './infrastructure/cardapio.repository';
import { ProdutosRepository } from './infrastructure/produtos.repository';

@Module({
  imports: [UnidadesModule],
  controllers: [ProdutosController, CardapioController],
  providers: [
    ProdutosService,
    CardapioService,
    ProdutosRepository,
    CardapioRepository,
  ],
  exports: [ProdutosService, CardapioRepository],
})
export class ProdutosModule {}
