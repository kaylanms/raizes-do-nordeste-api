import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser, Roles } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { PedidosService } from '../application/pedidos.service';
import { ApiErros } from '../../../shared/swagger/api-erros.decorator';
import {
  AtualizarStatusDto,
  CriarPedidoDto,
  ListarPedidosQueryDto,
} from './pedidos.dto';

@ApiTags('Pedidos')
@ApiBearerAuth()
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  @Post()
  @Roles(Perfil.CLIENTE, Perfil.ATENDENTE, Perfil.GERENTE, Perfil.ADMIN)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Repetir a mesma chave devolve o pedido original (200) em vez de criar outro.',
  })
  @ApiOperation({
    summary: 'Cria um pedido (valida estoque, calcula total e baixa o estoque)',
  })
  @ApiErros(403, 404, 409, 422)
  async criar(
    @Body() dto: CriarPedidoDto,
    @CurrentUser() user: UsuarioAutenticado,
    @Headers('idempotency-key') chave: string | undefined,
    @Res() res: Response,
  ) {
    const { pedido, reutilizado } = await this.service.criar(user, dto, chave);
    return res.status(reutilizado ? 200 : 201).json(pedido);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista pedidos (paginado). Filtros: canalPedido, status, unidadeId',
  })
  listar(
    @Query() q: ListarPedidosQueryDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.listar(user, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um pedido' })
  obter(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.obter(user, id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Atualiza o status (cozinha → pronto → entregue / cancelado), conforme perfil',
  })
  @ApiErros(403, 404, 409, 422)
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarStatusDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.atualizarStatus(user, id, dto);
  }
}
