import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RegistroAuditoria {
  usuarioId?: number | null;
  acao: string;
  entidade: string;
  entidadeId?: number | null;
  detalhes?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Auditoria');

  constructor(private readonly prisma: PrismaService) {}

  /** Aceita um `tx` para gravar a auditoria dentro da mesma transação da operação. */
  async registrar(
    dados: RegistroAuditoria,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.logAuditoria.create({
      data: {
        usuarioId: dados.usuarioId ?? null,
        acao: dados.acao,
        entidade: dados.entidade,
        entidadeId: dados.entidadeId ?? null,
        detalhes: dados.detalhes,
      },
    });
    this.logger.log(
      `${dados.acao} ${dados.entidade}#${dados.entidadeId ?? '-'} por usuario ${dados.usuarioId ?? 'anonimo'}`,
    );
  }
}
