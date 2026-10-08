import { Injectable } from '@nestjs/common';
import { Estoque } from '@prisma/client';
import { AuditService } from '../../../shared/audit/audit.service';
import { AppException } from '../../../shared/errors/app.exception';
import { garantirAcessoUnidade } from '../../../shared/guards/acesso-unidade';
import { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import {
  calcularSkip,
  montarPagina,
} from '../../../shared/pagination/paginacao.dto';
import { ProdutosService } from '../../produtos/application/produtos.service';
import { UnidadesService } from '../../unidades/application/unidades.service';
import {
  ConsultarEstoqueQueryDto,
  MovimentarEstoqueDto,
} from '../api/estoque.dto';
import { EstoqueRepository } from '../infrastructure/estoque.repository';

@Injectable()
export class EstoqueService {
  constructor(
    private readonly repo: EstoqueRepository,
    private readonly unidades: UnidadesService,
    private readonly produtos: ProdutosService,
    private readonly audit: AuditService,
  ) {}

  async movimentar(user: UsuarioAutenticado, dto: MovimentarEstoqueDto) {
    garantirAcessoUnidade(user, dto.unidadeId);
    await this.unidades.garantirExistente(dto.unidadeId);
    await this.produtos.obter(dto.produtoId);

    return this.repo.emTransacao(async (tx) => {
      let estoque: Estoque | null;

      if (dto.tipo === 'ENTRADA') {
        estoque = await this.repo.creditar(
          tx,
          dto.unidadeId,
          dto.produtoId,
          dto.quantidade,
        );
      } else {
        estoque = await this.repo.baixar(
          tx,
          dto.unidadeId,
          dto.produtoId,
          dto.quantidade,
        );
        if (!estoque) {
          const saldo = await this.repo.saldo(tx, dto.unidadeId, dto.produtoId);
          throw new AppException(
            409,
            'ESTOQUE_INSUFICIENTE',
            'Não há quantidade suficiente em estoque.',
            [{ field: 'quantidade', issue: `Disponível: ${saldo}` }],
          );
        }
      }

      await this.repo.registrarMovimento(tx, {
        estoqueId: estoque.id,
        usuarioId: user.id,
        tipo: dto.tipo,
        quantidade: dto.quantidade,
        motivo: dto.motivo,
      });
      await this.audit.registrar(
        {
          usuarioId: user.id,
          acao: 'ESTOQUE_MOVIMENTADO',
          entidade: 'Estoque',
          entidadeId: estoque.id,
          detalhes: {
            tipo: dto.tipo,
            quantidade: dto.quantidade,
            unidadeId: dto.unidadeId,
            produtoId: dto.produtoId,
          },
        },
        tx,
      );

      return {
        unidadeId: dto.unidadeId,
        produtoId: dto.produtoId,
        tipo: dto.tipo,
        quantidade: dto.quantidade,
        saldoAtual: estoque.quantidade,
      };
    });
  }

  async consultar(user: UsuarioAutenticado, q: ConsultarEstoqueQueryDto) {
    garantirAcessoUnidade(user, q.unidadeId);
    await this.unidades.garantirExistente(q.unidadeId);
    const { data, total } = await this.repo.listarPorUnidade(
      q.unidadeId,
      calcularSkip(q.page, q.limit),
      q.limit,
    );
    return montarPagina(
      data.map((e) => ({
        produtoId: e.produtoId,
        produto: e.produto.nome,
        quantidade: e.quantidade,
      })),
      total,
      q.page,
      q.limit,
    );
  }
}
