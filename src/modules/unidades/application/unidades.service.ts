import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../shared/audit/audit.service';
import { AppException } from '../../../shared/errors/app.exception';
import {
  PaginacaoQueryDto,
  calcularSkip,
  montarPagina,
} from '../../../shared/pagination/paginacao.dto';
import { CriarUnidadeDto } from '../api/unidades.dto';
import { UnidadesRepository } from '../infrastructure/unidades.repository';

@Injectable()
export class UnidadesService {
  constructor(
    private readonly repo: UnidadesRepository,
    private readonly audit: AuditService,
  ) {}

  async listar(q: PaginacaoQueryDto) {
    const { data, total } = await this.repo.listar(
      calcularSkip(q.page, q.limit),
      q.limit,
    );
    return montarPagina(data, total, q.page, q.limit);
  }

  async garantirExistente(id: number) {
    const unidade = await this.repo.buscarPorId(id);
    if (!unidade || !unidade.ativa) {
      throw new AppException(
        404,
        'UNIDADE_NAO_ENCONTRADA',
        'Unidade não encontrada.',
      );
    }
    return unidade;
  }

  async criar(dto: CriarUnidadeDto, usuarioId: number) {
    const unidade = await this.repo.criar({
      nome: dto.nome.trim(),
      cidade: dto.cidade.trim(),
      uf: dto.uf,
      matriz: dto.matriz ?? false,
    });
    await this.audit.registrar({
      usuarioId,
      acao: 'UNIDADE_CRIADA',
      entidade: 'Unidade',
      entidadeId: unidade.id,
    });
    return unidade;
  }
}
