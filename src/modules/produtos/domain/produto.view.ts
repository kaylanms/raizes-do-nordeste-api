import { Produto } from '@prisma/client';

export function paraView(p: Produto) {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    categoria: p.categoria,
    precoBase: Number(p.precoBase),
    ativo: p.ativo,
  };
}
