import { Injectable } from '@nestjs/common';
import { Prisma, StatusPagamento } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PayloadGateway } from '../domain/pagamento.gateway';

@Injectable()
export class PagamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  emTransacao<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  buscarPorChave(idempotencyKey: string) {
    return this.prisma.pagamento.findUnique({ where: { idempotencyKey } });
  }

  buscarPorId(id: number) {
    return this.prisma.pagamento.findUnique({ where: { id } });
  }

  criarPendente(dados: {
    pedidoId: number;
    valor: number;
    metodo: string;
    idempotencyKey?: string;
  }) {
    return this.prisma.pagamento.create({
      data: {
        pedidoId: dados.pedidoId,
        valor: dados.valor,
        metodo: dados.metodo,
        idempotencyKey: dados.idempotencyKey ?? null,
        status: StatusPagamento.PENDENTE,
      },
    });
  }

  registrarFalha(id: number, payload: PayloadGateway) {
    return this.prisma.pagamento.update({
      where: { id },
      data: { payloadResposta: payload },
    });
  }

  concluir(
    tx: Prisma.TransactionClient,
    id: number,
    dados: {
      status: StatusPagamento;
      referenciaExterna: string;
      payload: PayloadGateway;
    },
  ) {
    return tx.pagamento.update({
      where: { id },
      data: {
        status: dados.status,
        referenciaExterna: dados.referenciaExterna,
        payloadResposta: dados.payload,
      },
    });
  }
}
