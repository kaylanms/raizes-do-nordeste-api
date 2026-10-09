import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  GatewayIndisponivelError,
  PagamentoGateway,
  PayloadGateway,
  RespostaGateway,
  SolicitacaoCobranca,
} from '../domain/pagamento.gateway';

@Injectable()
export class PagamentoMockGateway implements PagamentoGateway {
  async cobrar(s: SolicitacaoCobranca): Promise<RespostaGateway> {
    await new Promise((r) => setTimeout(r, 150));

    if (s.simulacao === 'INDISPONIVEL') {
      throw new GatewayIndisponivelError();
    }

    const aprovado = s.simulacao !== 'RECUSAR';
    const transactionId = `mock_${randomUUID()}`;

    const payload: PayloadGateway = {
      provider: 'MOCK_PAY',
      transactionId,
      status: aprovado ? 'approved' : 'declined',
      amount: s.valor,
      currency: 'BRL',
      method: s.metodo,
      processedAt: new Date().toISOString(),
      message: aprovado
        ? 'Pagamento aprovado (simulado).'
        : 'Pagamento recusado pelo emissor (simulado).',
      ...(aprovado ? {} : { reason: 'INSUFFICIENT_FUNDS' }),
    };

    return {
      status: aprovado ? 'APROVADO' : 'RECUSADO',
      referenciaExterna: transactionId,
      payload,
    };
  }
}
