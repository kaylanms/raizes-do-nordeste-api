import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../shared/audit/audit.service';
import { garantirAcessoUnidade } from '../../../shared/guards/acesso-unidade';
import { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import {
  PaginacaoQueryDto,
  calcularSkip,
  montarPagina,
} from '../../../shared/pagination/paginacao.dto';
import { UnidadesService } from '../../unidades/application/unidades.service';
import { DefinirItemCardapioDto } from '../api/cardapio.dto';
import { CardapioRepository } from '../infrastructure/cardapio.repository';
import { ProdutosService } from './produtos.service';

@Injectable()
export class CardapioService {
  constructor(
    private readonly repo: CardapioRepository,
    private readonly unidades: UnidadesService,
    private readonly produtos: ProdutosService,
    private readonly audit: AuditService,
  ) {}

  async listar(unidadeId: number, q: PaginacaoQueryDto) {
    await this.unidades.garantirExistente(unidadeId);
    const { itens, total } = await this.repo.listar(
      unidadeId,
      calcularSkip(q.page, q.limit),
      q.limit,
    );
    return montarPagina(itens, total, q.page, q.limit);
  }

  async definir(
    user: UsuarioAutenticado,
    unidadeId: number,
    produtoId: number,
    dto: DefinirItemCardapioDto,
  ) {
    garantirAcessoUnidade(user, unidadeId);
    await this.unidades.garantirExistente(unidadeId);
    await this.produtos.obter(produtoId);

    const item = await this.repo.definir(
      unidadeId,
      produtoId,
      dto.preco,
      dto.disponivel ?? true,
    );
    await this.audit.registrar({
      usuarioId: user.id,
      acao: 'CARDAPIO_ATUALIZADO',
      entidade: 'CardapioUnidade',
      entidadeId: produtoId,
      detalhes: { unidadeId, preco: dto.preco },
    });
    return {
      unidadeId: item.unidadeId,
      produtoId: item.produtoId,
      preco: Number(item.preco),
      disponivel: item.disponivel,
    };
  }
}
