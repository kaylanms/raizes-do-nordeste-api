import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { CurrentUser, Roles } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { AuditoriaService } from '../application/auditoria.service';
import { ListarAuditoriaQueryDto } from './auditoria.dto';

@ApiTags('Auditoria')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.GERENTE)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get()
  @ApiOperation({
    summary:
      'Consulta a trilha de auditoria (ADMIN, GERENTE). Filtros: acao, entidade, entidadeId, usuarioId',
  })
  listar(
    @Query() q: ListarAuditoriaQueryDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.listar(user, q);
  }
}
