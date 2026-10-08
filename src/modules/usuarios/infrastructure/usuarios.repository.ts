import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  buscarPorId(id: number) {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  criar(data: Prisma.UsuarioCreateInput) {
    return this.prisma.usuario.create({ data });
  }

  anonimizar(id: number, senhaHash: string) {
    const agora = new Date();
    return this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id },
        data: {
          nome: 'Usuário anonimizado',
          email: `anonimizado-${id}@anonimizado.invalid`,
          senhaHash,
          ativo: false,
          anonimizadoEm: agora,
        },
      }),
      this.prisma.consentimento.updateMany({
        where: { usuarioId: id, revogadoEm: null },
        data: { revogadoEm: agora },
      }),
    ]);
  }
}
