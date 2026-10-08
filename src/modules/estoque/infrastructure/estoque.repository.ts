import { Injectable } from '@nestjs/common';
import { Estoque, Prisma, TipoMovimentoEstoque } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class EstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  emTransacao<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  /** Entrada: cria o registro de estoque da unidade se ainda não existir. */
  creditar(
    tx: Prisma.TransactionClient,
    unidadeId: number,
    produtoId: number,
    quantidade: number,
  ) {
    return tx.estoque.upsert({
      where: { unidadeId_produtoId: { unidadeId, produtoId } },
      create: { unidadeId, produtoId, quantidade },
      update: { quantidade: { increment: quantidade } },
    });
  }

  /** Saída atômica: só baixa se houver saldo. Retorna null quando o saldo é insuficiente. */
  async baixar(
    tx: Prisma.TransactionClient,
    unidadeId: number,
    produtoId: number,
    quantidade: number,
  ): Promise<Estoque | null> {
    const r = await tx.estoque.updateMany({
      where: { unidadeId, produtoId, quantidade: { gte: quantidade } },
      data: { quantidade: { decrement: quantidade } },
    });
    if (r.count === 0) return null;
    return tx.estoque.findUniqueOrThrow({
      where: { unidadeId_produtoId: { unidadeId, produtoId } },
    });
  }

  async saldo(
    tx: Prisma.TransactionClient,
    unidadeId: number,
    produtoId: number,
  ): Promise<number> {
    const e = await tx.estoque.findUnique({
      where: { unidadeId_produtoId: { unidadeId, produtoId } },
    });
    return e?.quantidade ?? 0;
  }

  registrarMovimento(
    tx: Prisma.TransactionClient,
    dados: {
      estoqueId: number;
      usuarioId: number;
      tipo: TipoMovimentoEstoque;
      quantidade: number;
      motivo?: string;
      pedidoId?: number;
    },
  ) {
    return tx.movimentoEstoque.create({ data: dados });
  }

  async listarPorUnidade(unidadeId: number, skip: number, take: number) {
    const where: Prisma.EstoqueWhereInput = { unidadeId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.estoque.findMany({
        where,
        include: { produto: { select: { nome: true } } },
        orderBy: { produto: { nome: 'asc' } },
        skip,
        take,
      }),
      this.prisma.estoque.count({ where }),
    ]);
    return { data, total };
  }
}
