import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../errors/app.exception';
import { IS_PUBLIC_KEY } from './decorators';
import { JwtPayload } from './usuario-autenticado';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (publica) return true;

    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new AppException(
        401,
        'NAO_AUTENTICADO',
        'Token de acesso ausente.',
      );
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = {
        id: payload.sub,
        perfil: payload.perfil,
        unidadeId: payload.unidadeId,
      };
      return true;
    } catch {
      throw new AppException(
        401,
        'TOKEN_INVALIDO',
        'Token inválido ou expirado.',
      );
    }
  }
}
