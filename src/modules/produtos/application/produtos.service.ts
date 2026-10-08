import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../shared/audit/audit.service';
import { AppException } from '../../../shared/errors/app.exception';
import {
  calcularSkip,
  montarPagina,
} from '../../../shared/pagination/paginacao.dto';
import {
  AtualizarProdutoDto,
  CriarProdutoDto,
  ListarProdutosQueryDto,
} from '../api/produtos.dto';
import { paraView } from '../domain/produto.view';
import { ProdutosRepository } from '../infrastructure/produtos.repository';

@Injectable()
export class ProdutosService {
  constructor(
    private readonly repo: ProdutosRepository,
    private readonly audit: AuditService,
  ) {}

  async listar(q: ListarProdutosQueryDto) {
    const { data, total } = await this.repo.listar(
      { categoria: q.categoria, busca: q.busca },
      calcularSkip(q.page, q.limit),
      q.limit,
    );
    return montarPagina(data.map(paraView), total, q.page, q.limit);
  }

  async obter(id: number) {
    const produto = await this.repo.buscarPorId(id);
    if (!produto || !produto.ativo) {
      throw new AppException(
        404,
        'PRODUTO_NAO_ENCONTRADO',
        'Produto não encontrado.',
      );
    }
    return produto;
  }

  async obterView(id: number) {
    return paraView(await this.obter(id));
  }

  async criar(dto: CriarProdutoDto, usuarioId: number) {
    const produto = await this.repo.criar({
      nome: dto.nome.trim(),
      descricao: dto.descricao,
      categoria: dto.categoria.trim(),
      precoBase: dto.precoBase,
    });
    await this.audit.registrar({
      usuarioId,
      acao: 'PRODUTO_CRIADO',
      entidade: 'Produto',
      entidadeId: produto.id,
      detalhes: { nome: produto.nome },
    });
    return paraView(produto);
  }

  async atualizar(id: number, dto: AtualizarProdutoDto, usuarioId: number) {
    await this.obter(id);
    const produto = await this.repo.atualizar(id, dto);
    await this.audit.registrar({
      usuarioId,
      acao: 'PRODUTO_ATUALIZADO',
      entidade: 'Produto',
      entidadeId: id,
    });
    return paraView(produto);
  }

  async desativar(id: number, usuarioId: number) {
    await this.obter(id);
    await this.repo.desativar(id);
    await this.audit.registrar({
      usuarioId,
      acao: 'PRODUTO_DESATIVADO',
      entidade: 'Produto',
      entidadeId: id,
    });
  }
}
