import { Injectable } from '@nestjs/common';
import {
  Perfil,
  Prisma,
  StatusPedido,
  TipoMovimentoEstoque,
} from '@prisma/client';
import { AuditService } from '../../../shared/audit/audit.service';
import {
  AppException,
  DetalheErro,
} from '../../../shared/errors/app.exception';
import { garantirAcessoUnidade } from '../../../shared/guards/acesso-unidade';
import { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import {
  calcularSkip,
  montarPagina,
} from '../../../shared/pagination/paginacao.dto';
import { EstoqueRepository } from '../../estoque/infrastructure/estoque.repository';
import { descontoDosPontosEmCentavos } from '../../fidelidade/domain/pontos.regras';
import { FidelidadeService } from '../../fidelidade/application/fidelidade.service';
import { UnidadesService } from '../../unidades/application/unidades.service';
import { UsuariosRepository } from '../../usuarios/infrastructure/usuarios.repository';
import {
  AtualizarStatusDto,
  CriarPedidoDto,
  ListarPedidosQueryDto,
} from '../api/pedidos.dto';
import {
  TRANSICOES,
  calcularDescontoPromocao,
  paraCentavos,
} from '../domain/pedido.regras';
import { PedidoCompleto, paraView } from '../domain/pedido.view';
import { PedidosRepository } from '../infrastructure/pedidos.repository';

interface LinhaPedido {
  index: number;
  produtoId: number;
  quantidade: number;
  precoCentavos: number;
}

@Injectable()
export class PedidosService {
  constructor(
    private readonly repo: PedidosRepository,
    private readonly estoque: EstoqueRepository,
    private readonly fidelidade: FidelidadeService,
    private readonly unidades: UnidadesService,
    private readonly usuarios: UsuariosRepository,
    private readonly audit: AuditService,
  ) {}

  async criar(
    user: UsuarioAutenticado,
    dto: CriarPedidoDto,
    chaveHeader?: string,
  ) {
    const clienteId = this.resolverCliente(user, dto);

    if (chaveHeader && chaveHeader.length > 100) {
      throw new AppException(
        422,
        'VALIDACAO_INVALIDA',
        'Idempotency-Key muito longa.',
        [{ field: 'Idempotency-Key', issue: 'Máximo de 100 caracteres' }],
      );
    }
    const chave = chaveHeader?.trim()
      ? `${user.id}:${chaveHeader.trim()}`
      : undefined;

    if (chave) {
      const existente = await this.repo.buscarPorChave(chave);
      if (existente) return { pedido: paraView(existente), reutilizado: true };
    }

    await this.unidades.garantirExistente(dto.unidadeId);
    if (user.perfil !== Perfil.CLIENTE)
      garantirAcessoUnidade(user, dto.unidadeId);

    const cliente = await this.usuarios.buscarPorId(clienteId);
    if (!cliente || !cliente.ativo || cliente.perfil !== Perfil.CLIENTE) {
      throw new AppException(
        404,
        'CLIENTE_NAO_ENCONTRADO',
        'Cliente não encontrado.',
      );
    }

    this.validarItensRepetidos(dto);
    const linhas = await this.montarLinhas(dto);

    const subtotal = linhas.reduce(
      (s, l) => s + l.precoCentavos * l.quantidade,
      0,
    );

    let promocaoId: number | null = null;
    let descontoPromo = 0;
    if (dto.codigoPromocao) {
      const promo = await this.repo.buscarPromocaoPorCodigo(
        dto.codigoPromocao.trim().toUpperCase(),
      );
      if (!promo)
        throw new AppException(
          404,
          'PROMOCAO_NAO_ENCONTRADA',
          'Promoção não encontrada.',
        );
      const agora = new Date();
      if (!promo.ativa || agora < promo.inicio || agora > promo.fim) {
        throw new AppException(
          409,
          'PROMOCAO_INVALIDA',
          'A promoção não está vigente.',
        );
      }
      promocaoId = promo.id;
      descontoPromo = calcularDescontoPromocao(
        promo.tipo,
        promo.valor,
        subtotal,
      );
    }

    let descontoPontos = 0;
    if (dto.pontosResgatar) {
      if (user.perfil !== Perfil.CLIENTE) {
        throw new AppException(
          403,
          'ACESSO_NEGADO',
          'O resgate de pontos só pode ser solicitado pelo próprio cliente.',
        );
      }
      descontoPontos = descontoDosPontosEmCentavos(dto.pontosResgatar);
      if (descontoPontos > subtotal - descontoPromo) {
        throw new AppException(
          422,
          'VALIDACAO_INVALIDA',
          'Dados da requisição inválidos.',
          [
            {
              field: 'pontosResgatar',
              issue: 'Os pontos superam o valor restante do pedido',
            },
          ],
        );
      }
    }

    const desconto = descontoPromo + descontoPontos;
    const total = subtotal - desconto;

    try {
      const pedido = await this.repo.emTransacao(async (tx) => {
        const criado = await this.repo.criar(tx, {
          clienteId,
          unidadeId: dto.unidadeId,
          canalPedido: dto.canalPedido,
          subtotal: subtotal / 100,
          desconto: desconto / 100,
          total: total / 100,
          promocaoId,
          formaPagamento: dto.formaPagamento,
          idempotencyKey: chave ?? null,
          itens: {
            create: linhas.map((l) => ({
              produtoId: l.produtoId,
              quantidade: l.quantidade,
              precoUnitario: l.precoCentavos / 100,
            })),
          },
        });

        const faltando: DetalheErro[] = [];
        for (const l of [...linhas].sort((a, b) => a.produtoId - b.produtoId)) {
          const est = await this.estoque.baixar(
            tx,
            dto.unidadeId,
            l.produtoId,
            l.quantidade,
          );
          if (!est) {
            const saldo = await this.estoque.saldo(
              tx,
              dto.unidadeId,
              l.produtoId,
            );
            faltando.push({
              field: `itens[${l.index}].quantidade`,
              issue: `Disponível: ${saldo}`,
            });
            continue;
          }
          await this.estoque.registrarMovimento(tx, {
            estoqueId: est.id,
            usuarioId: user.id,
            tipo: TipoMovimentoEstoque.SAIDA,
            quantidade: l.quantidade,
            pedidoId: criado.id,
            motivo: 'Pedido criado',
          });
        }
        if (faltando.length) {
          throw new AppException(
            409,
            'ESTOQUE_INSUFICIENTE',
            'Não há quantidade suficiente para um ou mais itens.',
            faltando,
          );
        }

        if (dto.pontosResgatar) {
          await this.fidelidade.resgatar(
            tx,
            clienteId,
            criado.id,
            dto.pontosResgatar,
          );
        }

        await this.audit.registrar(
          {
            usuarioId: user.id,
            acao: 'PEDIDO_CRIADO',
            entidade: 'Pedido',
            entidadeId: criado.id,
            detalhes: {
              canalPedido: dto.canalPedido,
              unidadeId: dto.unidadeId,
              total: total / 100,
              desconto: desconto / 100,
            },
          },
          tx,
        );
        return criado;
      });
      return { pedido: paraView(pedido), reutilizado: false };
    } catch (e) {
      if (
        chave &&
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const existente = await this.repo.buscarPorChave(chave);
        if (existente)
          return { pedido: paraView(existente), reutilizado: true };
      }
      throw e;
    }
  }

  private resolverCliente(
    user: UsuarioAutenticado,
    dto: CriarPedidoDto,
  ): number {
    if (user.perfil === Perfil.CLIENTE) {
      if (dto.clienteId && dto.clienteId !== user.id) {
        throw new AppException(
          403,
          'ACESSO_NEGADO',
          'Um cliente só pode criar pedidos em seu próprio nome.',
        );
      }
      return user.id;
    }
    if (!dto.clienteId) {
      throw new AppException(
        422,
        'VALIDACAO_INVALIDA',
        'Dados da requisição inválidos.',
        [
          {
            field: 'clienteId',
            issue: 'Obrigatório para pedidos criados pela equipe',
          },
        ],
      );
    }
    return dto.clienteId;
  }

  private validarItensRepetidos(dto: CriarPedidoDto) {
    const vistos = new Set<number>();
    const repetidos: DetalheErro[] = [];
    dto.itens.forEach((it, i) => {
      if (vistos.has(it.produtoId)) {
        repetidos.push({
          field: `itens[${i}].produtoId`,
          issue: 'Produto repetido: some as quantidades em um único item',
        });
      }
      vistos.add(it.produtoId);
    });
    if (repetidos.length) {
      throw new AppException(
        422,
        'VALIDACAO_INVALIDA',
        'Dados da requisição inválidos.',
        repetidos,
      );
    }
  }

  private async montarLinhas(dto: CriarPedidoDto): Promise<LinhaPedido[]> {
    const cardapio = await this.repo.buscarItensCardapio(
      dto.unidadeId,
      dto.itens.map((i) => i.produtoId),
    );
    const porProduto = new Map(
      cardapio.map((c) => [c.produtoId, c] as [number, typeof c]),
    );

    const naoEncontrados: DetalheErro[] = [];
    const indisponiveis: DetalheErro[] = [];
    const linhas: LinhaPedido[] = [];

    dto.itens.forEach((it, index) => {
      const c = porProduto.get(it.produtoId);
      if (!c || !c.produto.ativo) {
        naoEncontrados.push({
          field: `itens[${index}].produtoId`,
          issue: 'Produto inexistente ou fora do cardápio desta unidade',
        });
      } else if (!c.disponivel) {
        indisponiveis.push({
          field: `itens[${index}].produtoId`,
          issue: 'Produto indisponível no momento',
        });
      } else {
        linhas.push({
          index,
          produtoId: it.produtoId,
          quantidade: it.quantidade,
          precoCentavos: paraCentavos(c.preco),
        });
      }
    });

    if (naoEncontrados.length) {
      throw new AppException(
        404,
        'PRODUTO_NAO_ENCONTRADO',
        'Produto não encontrado na unidade.',
        naoEncontrados,
      );
    }
    if (indisponiveis.length) {
      throw new AppException(
        409,
        'PRODUTO_INDISPONIVEL',
        'Há produto indisponível no pedido.',
        indisponiveis,
      );
    }
    return linhas;
  }

  async listar(user: UsuarioAutenticado, q: ListarPedidosQueryDto) {
    const where: Prisma.PedidoWhereInput = {
      ...(q.canalPedido ? { canalPedido: q.canalPedido } : {}),
      ...(q.status ? { status: q.status } : {}),
    };

    if (user.perfil === Perfil.CLIENTE) {
      where.clienteId = user.id;
      if (q.unidadeId) where.unidadeId = q.unidadeId;
    } else if (user.perfil === Perfil.ADMIN) {
      if (q.unidadeId) where.unidadeId = q.unidadeId;
    } else {
      if (user.unidadeId == null) {
        throw new AppException(
          403,
          'UNIDADE_NAO_PERMITIDA',
          'Usuário sem unidade vinculada.',
        );
      }
      if (q.unidadeId) garantirAcessoUnidade(user, q.unidadeId);
      where.unidadeId = user.unidadeId;
    }

    const { data, total } = await this.repo.listar(
      where,
      calcularSkip(q.page, q.limit),
      q.limit,
    );
    return montarPagina(data.map(paraView), total, q.page, q.limit);
  }

  async obter(user: UsuarioAutenticado, id: number) {
    return paraView(await this.obterComAcesso(user, id));
  }

  async obterComAcesso(
    user: UsuarioAutenticado,
    id: number,
  ): Promise<PedidoCompleto> {
    const pedido = await this.repo.buscarPorId(id);
    const naoEncontrado = new AppException(
      404,
      'PEDIDO_NAO_ENCONTRADO',
      'Pedido não encontrado.',
    );
    if (!pedido) throw naoEncontrado;

    if (user.perfil === Perfil.CLIENTE) {
      if (pedido.clienteId !== user.id) throw naoEncontrado;
    } else {
      garantirAcessoUnidade(user, pedido.unidadeId);
    }
    return pedido;
  }

  async atualizarStatus(
    user: UsuarioAutenticado,
    id: number,
    dto: AtualizarStatusDto,
  ) {
    const pedido = await this.obterComAcesso(user, id);
    const novo = dto.status;

    const perfisPermitidos = TRANSICOES[pedido.status]?.[novo];
    if (!perfisPermitidos) {
      const destinos = Object.keys(TRANSICOES[pedido.status] ?? {});
      throw new AppException(
        409,
        'TRANSICAO_INVALIDA',
        `Não é possível mudar o pedido de ${pedido.status} para ${novo}.`,
        [
          {
            field: 'status',
            issue: `Destinos permitidos a partir de ${pedido.status}: ${destinos.join(', ') || 'nenhum'}`,
          },
        ],
      );
    }
    if (!perfisPermitidos.includes(user.perfil)) {
      throw new AppException(
        403,
        'ACESSO_NEGADO',
        'Seu perfil não pode realizar esta mudança de status.',
      );
    }

    if (novo === StatusPedido.CANCELADO) {
      await this.repo.emTransacao((tx) =>
        this.cancelarEmTransacao(tx, pedido, user.id, 'Cancelado pelo usuário'),
      );
    } else {
      await this.repo.emTransacao(async (tx) => {
        const r = await this.repo.mudarStatus(
          tx,
          pedido.id,
          pedido.status,
          novo,
        );
        if (r.count === 0) {
          throw new AppException(
            409,
            'CONFLITO_DE_STATUS',
            'O pedido foi alterado por outra operação. Consulte-o novamente.',
          );
        }
        await this.audit.registrar(
          {
            usuarioId: user.id,
            acao: 'PEDIDO_STATUS_ALTERADO',
            entidade: 'Pedido',
            entidadeId: pedido.id,
            detalhes: { de: pedido.status, para: novo },
          },
          tx,
        );
      });
    }

    const atualizado = await this.repo.buscarPorId(id);
    return paraView(atualizado!);
  }

  async marcarComoPagoEmTransacao(
    tx: Prisma.TransactionClient,
    pedido: PedidoCompleto,
    atorId: number,
  ) {
    const r = await this.repo.mudarStatus(
      tx,
      pedido.id,
      StatusPedido.AGUARDANDO_PAGAMENTO,
      StatusPedido.PAGO,
    );
    if (r.count === 0) {
      throw new AppException(
        409,
        'CONFLITO_DE_STATUS',
        'O pedido foi alterado por outra operação.',
      );
    }
    await this.audit.registrar(
      {
        usuarioId: atorId,
        acao: 'PEDIDO_STATUS_ALTERADO',
        entidade: 'Pedido',
        entidadeId: pedido.id,
        detalhes: {
          de: StatusPedido.AGUARDANDO_PAGAMENTO,
          para: StatusPedido.PAGO,
          origem: 'PAGAMENTO',
        },
      },
      tx,
    );
  }

  async cancelarEmTransacao(
    tx: Prisma.TransactionClient,
    pedido: PedidoCompleto,
    atorId: number,
    motivo: string,
  ) {
    const r = await this.repo.mudarStatus(
      tx,
      pedido.id,
      StatusPedido.AGUARDANDO_PAGAMENTO,
      StatusPedido.CANCELADO,
    );
    if (r.count === 0) {
      throw new AppException(
        409,
        'CONFLITO_DE_STATUS',
        'O pedido foi alterado por outra operação.',
      );
    }

    for (const item of [...pedido.itens].sort(
      (a, b) => a.produtoId - b.produtoId,
    )) {
      const est = await this.estoque.creditar(
        tx,
        pedido.unidadeId,
        item.produtoId,
        item.quantidade,
      );
      await this.estoque.registrarMovimento(tx, {
        estoqueId: est.id,
        usuarioId: atorId,
        tipo: TipoMovimentoEstoque.ESTORNO,
        quantidade: item.quantidade,
        pedidoId: pedido.id,
        motivo,
      });
    }
    await this.fidelidade.estornarResgate(tx, pedido.clienteId, pedido.id);

    await this.audit.registrar(
      {
        usuarioId: atorId,
        acao: 'PEDIDO_CANCELADO',
        entidade: 'Pedido',
        entidadeId: pedido.id,
        detalhes: { de: StatusPedido.AGUARDANDO_PAGAMENTO, motivo },
      },
      tx,
    );
  }
}
