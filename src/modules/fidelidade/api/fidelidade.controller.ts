import { Controller, Delete, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { CurrentUser, Roles } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { PaginacaoQueryDto } from '../../../shared/pagination/paginacao.dto';
import { FidelidadeService } from '../application/fidelidade.service';

@ApiTags('Fidelidade')
@ApiBearerAuth()
@Roles(Perfil.CLIENTE)
@Controller('fidelidade')
export class FidelidadeController {
  constructor(private readonly service: FidelidadeService) {}

  @Post('consentimento')
  @ApiOperation({
    summary: 'Concede consentimento para o programa de fidelidade (LGPD)',
  })
  conceder(@CurrentUser() user: UsuarioAutenticado) {
    return this.service.conceder(user.id);
  }

  @Delete('consentimento')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Revoga o consentimento (para de acumular e resgatar pontos)',
  })
  async revogar(@CurrentUser() user: UsuarioAutenticado) {
    await this.service.revogar(user.id);
  }

  @Get('saldo')
  @ApiOperation({
    summary: 'Consulta saldo de pontos e situação do consentimento',
  })
  saldo(@CurrentUser() user: UsuarioAutenticado) {
    return this.service.consultarSaldo(user.id);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Histórico de movimentos de pontos (paginado)' })
  historico(
    @CurrentUser() user: UsuarioAutenticado,
    @Query() q: PaginacaoQueryDto,
  ) {
    return this.service.historico(user.id, q);
  }
}
