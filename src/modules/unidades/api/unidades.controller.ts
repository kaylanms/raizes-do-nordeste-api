import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { CurrentUser, Roles } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { PaginacaoQueryDto } from '../../../shared/pagination/paginacao.dto';
import { UnidadesService } from '../application/unidades.service';
import { CriarUnidadeDto } from './unidades.dto';

@ApiTags('Unidades')
@ApiBearerAuth()
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly service: UnidadesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as unidades da rede (paginado)' })
  listar(@Query() q: PaginacaoQueryDto) {
    return this.service.listar(q);
  }

  @Post()
  @Roles(Perfil.ADMIN)
  @ApiOperation({ summary: 'Cadastra uma unidade (somente ADMIN)' })
  criar(@Body() dto: CriarUnidadeDto, @CurrentUser() user: UsuarioAutenticado) {
    return this.service.criar(dto, user.id);
  }
}
