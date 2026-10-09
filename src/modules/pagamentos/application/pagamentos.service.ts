import { Inject, Injectable } from '@nestjs/common';
import {
  Pagamento,
  Prisma,
  StatusPagamento,
  StatusPedido,
} from '@prisma/client';
import { AuditService } from '../../../shared/audit/audit.service';
import { AppException } from '../../../shared/errors/app.exception';
import { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { FidelidadeService } from '../../fidelidade/application/fidelidade.service';
import { PedidosService } from '../../pedidos/application/pedidos.service';
import {
  GatewayIndisponivelError,
  PAGAMENTO_GATEWAY,
  type PagamentoGateway,
  type RespostaGateway,
} from '../domain/pagamento.gateway';
import { SolicitarPagamentoDto } from '../api/pagamentos.dto';
import { PagamentosRepository } from '../infrastructure/pagamentos.repository';

@Injectable()
export class PagamentosService {
  constructor(
    private readonly repo: PagamentosRepository,
    private readonly pedidos: PedidosService,
    private readonly fidelidade: FidelidadeService,
    private readonly audit: AuditService,
    @Inject(PAGAMENTO_GATEWAY) private readonly gateway: PagamentoGateway,
  ) {}

  async pagar(
    user: UsuarioAutenticado,
    dto: SolicitarPagamentoDto,
    chaveHeader?: string,
  ) {
    const pedido = await this.pedidos.obterComAcesso(user, dto.pedidoId);
    const chave = chaveHeader?.trim()
      ? `${user.id}:${chaveHeader.trim()}`
      : undefined;

    let pagamento: Pagamento | null = null;
    if (chave) {
      pagamento = await this.repo.buscarPorChave(chave);
      if (pagamento) {
        if (pagamento.pedidoId !== pedido.id) {
          throw new AppException(
            409,
            'IDEMPOTENCY_KEY_EM_USO',
            'Esta Idempotency-Key já foi usada em outro pedido.',
          );
        }
        if (pagamento.status !== StatusPagamento.PENDENTE) {
          return {
            resposta: this.montarResposta(pagamento, pedido.status),
            reutilizado: true,
          };
        }
      }
    }

    if (pedido.status !== StatusPedido.AGUARDANDO_PAGAMENTO) {
      throw new AppException(
        409,
        'PEDIDO_NAO_AGUARDA_PAGAMENTO',
        `O pedido está com status ${pedido.status}.`,
        [{ field: 'pedidoId', issue: `Status atual: ${pedido.status}` }],
      );
    }

    const valor = Number(pedido.total);

    if (!pagamento) {
      try {
        pagamento = await this.repo.criarPendente({
          pedidoId: pedido.id,
          valor,
          metodo: pedido.formaPagamento,
          idempotencyKey: chave,
        });
      } catch (e) {
        if (
          chave &&
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          const existente = await this.repo.buscarPorChave(chave);
          if (existente)
            return {
              resposta: this.montarResposta(existente, pedido.status),
              reutilizado: true,
            };
        }
        throw e;
      }
    }
    const pagamentoId = pagamento.id;

    let retorno: RespostaGateway;
    try {
      retorno = await this.gateway.cobrar({
        pedidoId: pedido.id,
        valor,
        metodo: pedido.formaPagamento,
        simulacao: dto.simulacao,
      });
    } catch (e) {
      if (e instanceof GatewayIndisponivelError) {
        await this.repo.registrarFalha(pagamentoId, {
          error: 'GATEWAY_INDISPONIVEL',
          message: e.message,
          at: new Date().toISOString(),
        });
        await this.audit.registrar({
          usuarioId: user.id,
          acao: 'PAGAMENTO_GATEWAY_INDISPONIVEL',
          entidade: 'Pagamento',
          entidadeId: pagamentoId,
          detalhes: { pedidoId: pedido.id },
        });
        throw new AppException(
          503,
          'SERVICO_PAGAMENTO_INDISPONIVEL',
          'O serviço de pagamento está indisponível. O pedido foi mantido; tente novamente.',
          [
            {
              field: 'pedidoId',
              issue: 'Pedido continua AGUARDANDO_PAGAMENTO',
            },
          ],
        );
      }
      throw e;
    }

    const concluido = await this.repo.emTransacao(async (tx) => {
      const atualizado = await this.repo.concluir(tx, pagamentoId, {
        status: retorno.status,
        referenciaExterna: retorno.referenciaExterna,
        payload: retorno.payload,
      });

      if (retorno.status === StatusPagamento.APROVADO) {
        await this.pedidos.marcarComoPagoEmTransacao(tx, pedido, user.id);
        const pontos = await this.fidelidade.acumular(
          tx,
          pedido.clienteId,
          pedido.id,
          valor,
        );
        await this.audit.registrar(
          {
            usuarioId: user.id,
            acao: 'PAGAMENTO_APROVADO',
            entidade: 'Pagamento',
            entidadeId: pagamentoId,
            detalhes: { pedidoId: pedido.id, valor, pontosAcumulados: pontos },
          },
          tx,
        );
      } else {
        await this.pedidos.cancelarEmTransacao(
          tx,
          pedido,
          user.id,
          'Pagamento recusado',
        );
        await this.audit.registrar(
          {
            usuarioId: user.id,
            acao: 'PAGAMENTO_RECUSADO',
            entidade: 'Pagamento',
            entidadeId: pagamentoId,
            detalhes: { pedidoId: pedido.id, valor },
          },
          tx,
        );
      }
      return atualizado;
    });

    const statusPedido =
      retorno.status === StatusPagamento.APROVADO
        ? StatusPedido.PAGO
        : StatusPedido.CANCELADO;
    return {
      resposta: this.montarResposta(concluido, statusPedido),
      reutilizado: false,
    };
  }

  async consultar(user: UsuarioAutenticado, id: number) {
    const pagamento = await this.repo.buscarPorId(id);
    if (!pagamento) {
      throw new AppException(
        404,
        'PAGAMENTO_NAO_ENCONTRADO',
        'Pagamento não encontrado.',
      );
    }
    const pedido = await this.pedidos.obterComAcesso(user, pagamento.pedidoId);
    return this.montarResposta(pagamento, pedido.status);
  }

  private montarResposta(p: Pagamento, statusPedido: StatusPedido) {
    const payload = (p.payloadResposta ?? {}) as Record<string, unknown>;
    return {
      pagamentoId: p.id,
      pedidoId: p.pedidoId,
      status: p.status,
      valor: Number(p.valor),
      metodo: p.metodo,
      referenciaExterna: p.referenciaExterna,
      mensagem: String(payload['message'] ?? ''),
      payload,
      pedidoStatus: statusPedido,
      createdAt: p.criadoEm,
    };
  }
}
