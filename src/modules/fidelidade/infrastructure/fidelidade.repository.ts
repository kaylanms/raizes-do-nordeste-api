import { Injectable } from '@nestjs/common';
import {
  FinalidadeConsentimento,
  Prisma,
  TipoMovimentoPontos,
} from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  BASE_LEGAL_FIDELIDADE,
  VERSAO_TERMO_ATUAL,
} from '../domain/pontos.regras';

@Injectable()
export class FidelidadeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return tx ?? this.prisma;
  }

  async consentimentoAtivo(
    usuarioId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const c = await this.db(tx).consentimento.findFirst({
      where: {
        usuarioId,
        finalidade: FinalidadeConsentimento.FIDELIDADE,
        concedido: true,
        revogadoEm: null,
      },
      select: { id: true },
    });
    return c !== null;
  }

  conceder(usuarioId: number) {
    return this.prisma.consentimento.create({
      data: {
        usuarioId,
        finalidade: FinalidadeConsentimento.FIDELIDADE,
        baseLegal: BASE_LEGAL_FIDELIDADE,
        versaoTermo: VERSAO_TERMO_ATUAL,
        concedido: true,
      },
    });
  }

  revogar(usuarioId: number) {
    return this.prisma.consentimento.updateMany({
      where: {
        usuarioId,
        finalidade: FinalidadeConsentimento.FIDELIDADE,
        revogadoEm: null,
      },
      data: { revogadoEm: new Date() },
    });
  }

  async saldo(
    usuarioId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const grupos = await this.db(tx).movimentoPontos.groupBy({
      by: ['tipo'],
      where: { usuarioId },
      _sum: { pontos: true },
    });
    return grupos.reduce((saldo, g) => {
      const pontos = g._sum.pontos ?? 0;
      return g.tipo === TipoMovimentoPontos.RESGATE
        ? saldo - pontos
        : saldo + pontos;
    }, 0);
  }

  travarUsuario(tx: Prisma.TransactionClient, usuarioId: number) {
    return tx.$queryRaw`SELECT id FROM "usuarios" WHERE id = ${usuarioId} FOR UPDATE`;
  }

  registrar(
    tx: Prisma.TransactionClient,
    dados: {
      usuarioId: number;
      pedidoId?: number;
      tipo: TipoMovimentoPontos;
      pontos: number;
    },
  ) {
    return tx.movimentoPontos.create({ data: dados });
  }

  async pontosResgatadosDoPedido(
    tx: Prisma.TransactionClient,
    pedidoId: number,
  ): Promise<number> {
    const r = await tx.movimentoPontos.aggregate({
      where: { pedidoId, tipo: TipoMovimentoPontos.RESGATE },
      _sum: { pontos: true },
    });
    return r._sum.pontos ?? 0;
  }

  async listarMovimentos(usuarioId: number, skip: number, take: number) {
    const where: Prisma.MovimentoPontosWhereInput = { usuarioId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.movimentoPontos.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take,
      }),
      this.prisma.movimentoPontos.count({ where }),
    ]);
    return { data, total };
  }
}
