import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../../shared/audit/audit.service';
import { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import {
  calcularSkip,
  montarPagina,
} from '../../../shared/pagination/paginacao.dto';
import { ListarAuditoriaQueryDto } from '../api/auditoria.dto';
import { AuditoriaRepository } from '../infrastructure/auditoria.repository';

@Injectable()
export class AuditoriaService {
  constructor(
    private readonly repo: AuditoriaRepository,
    private readonly audit: AuditService,
  ) {}

  async listar(user: UsuarioAutenticado, q: ListarAuditoriaQueryDto) {
    const where: Prisma.LogAuditoriaWhereInput = {
      ...(q.acao ? { acao: q.acao } : {}),
      ...(q.entidade ? { entidade: q.entidade } : {}),
      ...(q.entidadeId ? { entidadeId: q.entidadeId } : {}),
      ...(q.usuarioId ? { usuarioId: q.usuarioId } : {}),
    };
    const { data, total } = await this.repo.listar(
      where,
      calcularSkip(q.page, q.limit),
      q.limit,
    );

    await this.audit.registrar({
      usuarioId: user.id,
      acao: 'AUDITORIA_CONSULTADA',
      entidade: 'LogAuditoria',
      detalhes: { acao: q.acao ?? null, entidade: q.entidade ?? null },
    });

    return montarPagina(
      data.map((l) => ({
        id: l.id,
        acao: l.acao,
        entidade: l.entidade,
        entidadeId: l.entidadeId,
        usuarioId: l.usuarioId,
        detalhes: l.detalhes,
        createdAt: l.criadoEm,
      })),
      total,
      q.page,
      q.limit,
    );
  }
}
