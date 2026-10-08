import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { CurrentUser, Roles } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { PaginacaoQueryDto } from '../../../shared/pagination/paginacao.dto';
import { CardapioService } from '../application/cardapio.service';
import { DefinirItemCardapioDto } from './cardapio.dto';

@ApiTags('Cardápio')
@ApiBearerAuth()
@Controller('unidades/:unidadeId/cardapio')
export class CardapioController {
  constructor(private readonly service: CardapioService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta o cardápio de uma unidade (paginado)' })
  listar(
    @Param('unidadeId', ParseIntPipe) unidadeId: number,
    @Query() q: PaginacaoQueryDto,
  ) {
    return this.service.listar(unidadeId, q);
  }

  @Put(':produtoId')
  @Roles(Perfil.ADMIN, Perfil.GERENTE)
  @ApiOperation({
    summary:
      'Define preço e disponibilidade de um produto na unidade (GERENTE só na sua unidade)',
  })
  definir(
    @Param('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('produtoId', ParseIntPipe) produtoId: number,
    @Body() dto: DefinirItemCardapioDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.definir(user, unidadeId, produtoId, dto);
  }
}
