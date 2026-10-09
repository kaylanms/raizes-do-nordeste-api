import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class AuditoriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    where: Prisma.LogAuditoriaWhereInput,
    skip: number,
    take: number,
  ) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.logAuditoria.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take,
      }),
      this.prisma.logAuditoria.count({ where }),
    ]);
    return { data, total };
  }
}
