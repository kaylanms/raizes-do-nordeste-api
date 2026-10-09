import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
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
import { PagamentosService } from '../application/pagamentos.service';
import { SolicitarPagamentoDto } from './pagamentos.dto';

@ApiTags('Pagamentos')
@ApiBearerAuth()
@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly service: PagamentosService) {}

  @Post()
  @Roles(Perfil.CLIENTE, Perfil.ATENDENTE, Perfil.GERENTE, Perfil.ADMIN)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Evita cobrança duplicada: repetir a chave devolve o resultado original (200).',
  })
  @ApiOperation({
    summary:
      'Solicita o pagamento do pedido ao gateway mock e registra o retorno',
  })
  async pagar(
    @Body() dto: SolicitarPagamentoDto,
    @CurrentUser() user: UsuarioAutenticado,
    @Headers('idempotency-key') chave: string | undefined,
    @Res() res: Response,
  ) {
    const { resposta, reutilizado } = await this.service.pagar(
      user,
      dto,
      chave,
    );
    return res.status(reutilizado ? 200 : 201).json(resposta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um pagamento' })
  consultar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.consultar(user, id);
  }
}
