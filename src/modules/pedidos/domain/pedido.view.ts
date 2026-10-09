import { Prisma } from '@prisma/client';

export const PEDIDO_INCLUDE = {
  itens: {
    include: { produto: { select: { nome: true } } },
    orderBy: { id: 'asc' },
  },
  promocao: { select: { codigo: true } },
} satisfies Prisma.PedidoInclude;

export type PedidoCompleto = Prisma.PedidoGetPayload<{
  include: typeof PEDIDO_INCLUDE;
}>;

export function paraView(p: PedidoCompleto) {
  return {
    pedidoId: p.id,
    canalPedido: p.canalPedido,
    status: p.status,
    unidadeId: p.unidadeId,
    clienteId: p.clienteId,
    itens: p.itens.map((i) => ({
      produtoId: i.produtoId,
      nome: i.produto.nome,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario),
    })),
    subtotal: Number(p.subtotal),
    desconto: Number(p.desconto),
    total: Number(p.total),
    promocao: p.promocao?.codigo ?? null,
    formaPagamento: p.formaPagamento,
    createdAt: p.criadoEm,
    updatedAt: p.atualizadoEm,
  };
}
