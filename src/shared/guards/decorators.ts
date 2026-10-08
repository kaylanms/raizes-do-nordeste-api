import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { UsuarioAutenticado } from './usuario-autenticado';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...perfis: Perfil[]) => SetMetadata(ROLES_KEY, perfis);

export const CurrentUser = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest().user,
);
