import { Perfil, StatusPedido, TipoPromocao } from '@prisma/client';

export const TRANSICOES: Partial<
  Record<StatusPedido, Partial<Record<StatusPedido, Perfil[]>>>
> = {
  [StatusPedido.AGUARDANDO_PAGAMENTO]: {
    [StatusPedido.CANCELADO]: [
      Perfil.CLIENTE,
      Perfil.ATENDENTE,
      Perfil.GERENTE,
      Perfil.ADMIN,
    ],
  },
  [StatusPedido.PAGO]: {
    [StatusPedido.EM_PREPARO]: [Perfil.COZINHA, Perfil.GERENTE, Perfil.ADMIN],
  },
  [StatusPedido.EM_PREPARO]: {
    [StatusPedido.PRONTO]: [Perfil.COZINHA, Perfil.GERENTE, Perfil.ADMIN],
  },
  [StatusPedido.PRONTO]: {
    [StatusPedido.ENTREGUE]: [Perfil.ATENDENTE, Perfil.GERENTE, Perfil.ADMIN],
  },
};

export const paraCentavos = (valor: unknown): number =>
  Math.round(Number(valor) * 100);

export function calcularDescontoPromocao(
  tipo: TipoPromocao,
  valor: unknown,
  subtotalCentavos: number,
): number {
  const bruto =
    tipo === TipoPromocao.PERCENTUAL
      ? Math.round((subtotalCentavos * Number(valor)) / 100)
      : paraCentavos(valor);
  return Math.min(bruto, subtotalCentavos);
}
