import { Injectable } from '@nestjs/common';
import { Prisma, StatusPedido } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PEDIDO_INCLUDE } from '../domain/pedido.view';

@Injectable()
export class PedidosRepository {
  constructor(private readonly prisma: PrismaService) {}

  emTransacao<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  buscarPorId(id: number) {
    return this.prisma.pedido.findUnique({
      where: { id },
      include: PEDIDO_INCLUDE,
    });
  }

  buscarPorChave(idempotencyKey: string) {
    return this.prisma.pedido.findUnique({
      where: { idempotencyKey },
      include: PEDIDO_INCLUDE,
    });
  }

  buscarItensCardapio(unidadeId: number, produtoIds: number[]) {
    return this.prisma.cardapioUnidade.findMany({
      where: { unidadeId, produtoId: { in: produtoIds } },
      include: { produto: true },
    });
  }

  buscarPromocaoPorCodigo(codigo: string) {
    return this.prisma.promocao.findUnique({ where: { codigo } });
  }

  criar(tx: Prisma.TransactionClient, data: Prisma.PedidoUncheckedCreateInput) {
    return tx.pedido.create({ data, include: PEDIDO_INCLUDE });
  }

  mudarStatus(
    tx: Prisma.TransactionClient,
    id: number,
    de: StatusPedido,
    para: StatusPedido,
  ) {
    return tx.pedido.updateMany({
      where: { id, status: de },
      data: { status: para },
    });
  }

  async listar(where: Prisma.PedidoWhereInput, skip: number, take: number) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.pedido.findMany({
        where,
        include: PEDIDO_INCLUDE,
        orderBy: { criadoEm: 'desc' },
        skip,
        take,
      }),
      this.prisma.pedido.count({ where }),
    ]);
    return { data, total };
  }
}
