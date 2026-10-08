import { Perfil, Usuario } from '@prisma/client';

export interface UsuarioPublico {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  unidadeId: number | null;
  criadoEm: Date;
}

export function paraPublico(u: Usuario): UsuarioPublico {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    unidadeId: u.unidadeId,
    criadoEm: u.criadoEm,
  };
}
