import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CardapioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(unidadeId: number, skip: number, take: number) {
    const where: Prisma.CardapioUnidadeWhereInput = {
      unidadeId,
      disponivel: true,
      produto: { ativo: true },
    };
    const [itens, total] = await this.prisma.$transaction([
      this.prisma.cardapioUnidade.findMany({
        where,
        include: { produto: true },
        orderBy: { produto: { nome: 'asc' } },
        skip,
        take,
      }),
      this.prisma.cardapioUnidade.count({ where }),
    ]);

    const estoques = await this.prisma.estoque.findMany({
      where: { unidadeId, produtoId: { in: itens.map((i) => i.produtoId) } },
    });
    const saldo = new Map(
      estoques.map((e) => [e.produtoId, e.quantidade] as [number, number]),
    );

    return {
      total,
      itens: itens.map((i) => ({
        produtoId: i.produtoId,
        nome: i.produto.nome,
        descricao: i.produto.descricao,
        categoria: i.produto.categoria,
        preco: Number(i.preco),
        emEstoque: (saldo.get(i.produtoId) ?? 0) > 0,
      })),
    };
  }

  definir(
    unidadeId: number,
    produtoId: number,
    preco: number,
    disponivel: boolean,
  ) {
    return this.prisma.cardapioUnidade.upsert({
      where: { unidadeId_produtoId: { unidadeId, produtoId } },
      create: { unidadeId, produtoId, preco, disponivel },
      update: { preco, disponivel },
    });
  }
}
