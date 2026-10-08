import { Injectable } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../shared/audit/audit.service';
import { AppException } from '../../../shared/errors/app.exception';
import { paraPublico } from '../domain/usuario.entity';
import { CadastrarUsuarioDto } from '../api/usuarios.dto';
import { PasswordHasher } from '../infrastructure/password-hasher';
import { UsuariosRepository } from '../infrastructure/usuarios.repository';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly repo: UsuariosRepository,
    private readonly hasher: PasswordHasher,
    private readonly audit: AuditService,
  ) {}

  async cadastrar(dto: CadastrarUsuarioDto) {
    const email = dto.email.trim().toLowerCase();

    if (await this.repo.buscarPorEmail(email)) {
      throw new AppException(
        409,
        'EMAIL_JA_CADASTRADO',
        'Já existe um usuário com este e-mail.',
        [{ field: 'email', issue: 'E-mail já cadastrado' }],
      );
    }

    const usuario = await this.repo.criar({
      nome: dto.nome.trim(),
      email,
      senhaHash: await this.hasher.hash(dto.senha),
      perfil: Perfil.CLIENTE,
    });

    await this.audit.registrar({
      usuarioId: usuario.id,
      acao: 'USUARIO_CRIADO',
      entidade: 'Usuario',
      entidadeId: usuario.id,
    });
    return paraPublico(usuario);
  }

  async obterPerfil(id: number) {
    const usuario = await this.repo.buscarPorId(id);
    if (!usuario || !usuario.ativo) {
      throw new AppException(
        404,
        'USUARIO_NAO_ENCONTRADO',
        'Usuário não encontrado.',
      );
    }
    return paraPublico(usuario);
  }

  async anonimizar(id: number) {
    await this.obterPerfil(id);
    await this.repo.anonimizar(id, await this.hasher.hash(randomUUID()));
    await this.audit.registrar({
      usuarioId: id,
      acao: 'USUARIO_ANONIMIZADO',
      entidade: 'Usuario',
      entidadeId: id,
    });
  }
}
