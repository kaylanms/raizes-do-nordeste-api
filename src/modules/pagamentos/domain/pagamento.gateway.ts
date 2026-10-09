export const PAGAMENTO_GATEWAY = Symbol('PAGAMENTO_GATEWAY');

export type Simulacao = 'APROVAR' | 'RECUSAR' | 'INDISPONIVEL';

export type PayloadGateway = Record<string, string | number | boolean>;

export interface SolicitacaoCobranca {
  pedidoId: number;
  valor: number;
  metodo: string;
  simulacao?: Simulacao;
}

export interface RespostaGateway {
  status: 'APROVADO' | 'RECUSADO';
  referenciaExterna: string;
  payload: PayloadGateway;
}

export interface PagamentoGateway {
  cobrar(solicitacao: SolicitacaoCobranca): Promise<RespostaGateway>;
}

export class GatewayIndisponivelError extends Error {
  constructor(mensagem = 'Serviço de pagamento indisponível.') {
    super(mensagem);
    this.name = 'GatewayIndisponivelError';
  }
}
