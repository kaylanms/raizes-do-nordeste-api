import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { CurrentUser, Roles } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { EstoqueService } from '../application/estoque.service';
import { ConsultarEstoqueQueryDto, MovimentarEstoqueDto } from './estoque.dto';

@ApiTags('Estoque')
@ApiBearerAuth()
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly service: EstoqueService) {}

  @Post('movimentos')
  @Roles(Perfil.ADMIN, Perfil.GERENTE)
  @ApiOperation({
    summary: 'Registra entrada ou saída de estoque (GERENTE só na sua unidade)',
  })
  movimentar(
    @Body() dto: MovimentarEstoqueDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.movimentar(user, dto);
  }

  @Get()
  @Roles(Perfil.ADMIN, Perfil.GERENTE, Perfil.ATENDENTE)
  @ApiOperation({
    summary: 'Consulta o saldo de estoque de uma unidade (paginado)',
  })
  consultar(
    @Query() q: ConsultarEstoqueQueryDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.consultar(user, q);
  }
}
