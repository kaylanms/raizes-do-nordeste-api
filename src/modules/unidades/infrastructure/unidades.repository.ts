import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UnidadesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(skip: number, take: number) {
    const where: Prisma.UnidadeWhereInput = { ativa: true };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.unidade.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip,
        take,
      }),
      this.prisma.unidade.count({ where }),
    ]);
    return { data, total };
  }

  buscarPorId(id: number) {
    return this.prisma.unidade.findUnique({ where: { id } });
  }

  criar(data: Prisma.UnidadeCreateInput) {
    return this.prisma.unidade.create({ data });
  }
}
