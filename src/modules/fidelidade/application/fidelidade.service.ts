import { Injectable } from '@nestjs/common';
import { Prisma, TipoMovimentoPontos } from '@prisma/client';
import { AuditService } from '../../../shared/audit/audit.service';
import { AppException } from '../../../shared/errors/app.exception';
import {
  PaginacaoQueryDto,
  calcularSkip,
  montarPagina,
} from '../../../shared/pagination/paginacao.dto';
import { VALOR_PONTO_EM_CENTAVOS, pontosGanhos } from '../domain/pontos.regras';
import { FidelidadeRepository } from '../infrastructure/fidelidade.repository';

@Injectable()
export class FidelidadeService {
  constructor(
    private readonly repo: FidelidadeRepository,
    private readonly audit: AuditService,
  ) {}

  async conceder(usuarioId: number) {
    if (await this.repo.consentimentoAtivo(usuarioId)) {
      throw new AppException(
        409,
        'CONSENTIMENTO_JA_ATIVO',
        'O consentimento já está ativo.',
      );
    }
    const c = await this.repo.conceder(usuarioId);
    await this.audit.registrar({
      usuarioId,
      acao: 'CONSENTIMENTO_CONCEDIDO',
      entidade: 'Consentimento',
      entidadeId: c.id,
      detalhes: { finalidade: c.finalidade, versaoTermo: c.versaoTermo },
    });
    return {
      finalidade: c.finalidade,
      baseLegal: c.baseLegal,
      versaoTermo: c.versaoTermo,
      concedido: c.concedido,
      registradoEm: c.registradoEm,
    };
  }

  async revogar(usuarioId: number) {
    const r = await this.repo.revogar(usuarioId);
    if (r.count === 0) {
      throw new AppException(
        404,
        'CONSENTIMENTO_NAO_ENCONTRADO',
        'Não há consentimento ativo para revogar.',
      );
    }
    await this.audit.registrar({
      usuarioId,
      acao: 'CONSENTIMENTO_REVOGADO',
      entidade: 'Consentimento',
      detalhes: { finalidade: 'FIDELIDADE' },
    });
  }

  async consultarSaldo(usuarioId: number) {
    const [consentimentoAtivo, saldoPontos] = await Promise.all([
      this.repo.consentimentoAtivo(usuarioId),
      this.repo.saldo(usuarioId),
    ]);
    return {
      consentimentoAtivo,
      saldoPontos,
      equivalenteEmReais: (saldoPontos * VALOR_PONTO_EM_CENTAVOS) / 100,
    };
  }

  async historico(usuarioId: number, q: PaginacaoQueryDto) {
    const { data, total } = await this.repo.listarMovimentos(
      usuarioId,
      calcularSkip(q.page, q.limit),
      q.limit,
    );
    return montarPagina(
      data.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        pontos: m.pontos,
        pedidoId: m.pedidoId,
        createdAt: m.criadoEm,
      })),
      total,
      q.page,
      q.limit,
    );
  }

  async resgatar(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    pedidoId: number,
    pontos: number,
  ) {
    await this.repo.travarUsuario(tx, usuarioId);

    if (!(await this.repo.consentimentoAtivo(usuarioId, tx))) {
      throw new AppException(
        409,
        'CONSENTIMENTO_NECESSARIO',
        'O resgate de pontos exige consentimento ativo no programa de fidelidade.',
      );
    }
    const saldo = await this.repo.saldo(usuarioId, tx);
    if (saldo < pontos) {
      throw new AppException(
        409,
        'SALDO_PONTOS_INSUFICIENTE',
        'Saldo de pontos insuficiente.',
        [{ field: 'pontosResgatar', issue: `Saldo disponível: ${saldo}` }],
      );
    }
    await this.repo.registrar(tx, {
      usuarioId,
      pedidoId,
      tipo: TipoMovimentoPontos.RESGATE,
      pontos,
    });
  }

  async acumular(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    pedidoId: number,
    totalEmReais: number,
  ) {
    const pontos = pontosGanhos(totalEmReais);
    if (pontos <= 0) return 0;
    if (!(await this.repo.consentimentoAtivo(usuarioId, tx))) return 0;
    await this.repo.registrar(tx, {
      usuarioId,
      pedidoId,
      tipo: TipoMovimentoPontos.ACUMULO,
      pontos,
    });
    return pontos;
  }

  async estornarResgate(
    tx: Prisma.TransactionClient,
    usuarioId: number,
    pedidoId: number,
  ) {
    const pontos = await this.repo.pontosResgatadosDoPedido(tx, pedidoId);
    if (pontos > 0) {
      await this.repo.registrar(tx, {
        usuarioId,
        pedidoId,
        tipo: TipoMovimentoPontos.ESTORNO,
        pontos,
      });
    }
  }
}
