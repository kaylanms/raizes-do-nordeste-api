import { Perfil } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  perfil: Perfil;
  unidadeId: number | null;
}

export interface UsuarioAutenticado {
  id: number;
  perfil: Perfil;
  unidadeId: number | null;
}
