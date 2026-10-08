import { Perfil } from '@prisma/client';
import { AppException } from '../errors/app.exception';
import { UsuarioAutenticado } from './usuario-autenticado';

export function garantirAcessoUnidade(
  user: UsuarioAutenticado,
  unidadeId: number,
): void {
  if (user.perfil === Perfil.ADMIN) return;
  if (user.unidadeId !== unidadeId) {
    throw new AppException(
      403,
      'UNIDADE_NAO_PERMITIDA',
      'Você não tem acesso a esta unidade.',
    );
  }
}
