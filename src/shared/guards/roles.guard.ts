import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '@prisma/client';
import { AppException } from '../errors/app.exception';
import { ROLES_KEY } from './decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Perfil[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!exigidos?.length) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user || !exigidos.includes(user.perfil)) {
      throw new AppException(
        403,
        'ACESSO_NEGADO',
        'Seu perfil não tem permissão para esta operação.',
      );
    }
    return true;
  }
}
