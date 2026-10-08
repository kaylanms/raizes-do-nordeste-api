import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class ProdutosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    filtros: { categoria?: string; busca?: string },
    skip: number,
    take: number,
  ) {
    const where: Prisma.ProdutoWhereInput = {
      ativo: true,
      ...(filtros.categoria && {
        categoria: { equals: filtros.categoria, mode: 'insensitive' },
      }),
      ...(filtros.busca && {
        nome: { contains: filtros.busca, mode: 'insensitive' },
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.produto.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip,
        take,
      }),
      this.prisma.produto.count({ where }),
    ]);
    return { data, total };
  }

  buscarPorId(id: number) {
    return this.prisma.produto.findUnique({ where: { id } });
  }

  criar(data: Prisma.ProdutoCreateInput) {
    return this.prisma.produto.create({ data });
  }

  atualizar(id: number, data: Prisma.ProdutoUpdateInput) {
    return this.prisma.produto.update({ where: { id }, data });
  }

  desativar(id: number) {
    return this.prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
