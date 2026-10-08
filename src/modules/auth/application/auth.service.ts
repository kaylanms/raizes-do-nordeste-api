import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../../../shared/audit/audit.service';
import { AppException } from '../../../shared/errors/app.exception';
import { JwtPayload } from '../../../shared/guards/usuario-autenticado';
import { PasswordHasher } from '../../usuarios/infrastructure/password-hasher';
import { UsuariosRepository } from '../../usuarios/infrastructure/usuarios.repository';
import { LoginDto } from '../api/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.buscarPorEmail(
      dto.email.trim().toLowerCase(),
    );
    const valido =
      !!usuario &&
      usuario.ativo &&
      (await this.hasher.comparar(dto.senha, usuario.senhaHash));

    if (!usuario || !valido) {
      await this.audit.registrar({
        usuarioId: usuario?.id ?? null,
        acao: 'LOGIN_FALHA',
        entidade: 'Usuario',
        entidadeId: usuario?.id ?? null,
      });
      throw new AppException(
        401,
        'CREDENCIAIS_INVALIDAS',
        'E-mail ou senha inválidos.',
      );
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      perfil: usuario.perfil,
      unidadeId: usuario.unidadeId,
    };

    await this.audit.registrar({
      usuarioId: usuario.id,
      acao: 'LOGIN_SUCESSO',
      entidade: 'Usuario',
      entidadeId: usuario.id,
    });

    return {
      accessToken: await this.jwt.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: Number(this.config.get('JWT_EXPIRES_IN') ?? 3600),
      user: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
    };
  }
}
