import { Controller, Delete, Get, HttpCode, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { UsuariosService } from '../application/usuarios.service';
import { CadastrarUsuarioDto } from './usuarios.dto';
import { ApiErros } from '../../../shared/swagger/api-erros.decorator';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Cadastra um novo cliente' })
  @ApiErros(409, 422)
  cadastrar(@Body() dto: CadastrarUsuarioDto) {
    return this.service.cadastrar(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  perfil(@CurrentUser() user: UsuarioAutenticado) {
    return this.service.obterPerfil(user.id);
  }

  @ApiBearerAuth()
  @Delete('me')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Anonimiza a própria conta (direito de eliminação, LGPD)',
  })
  async anonimizar(@CurrentUser() user: UsuarioAutenticado) {
    await this.service.anonimizar(user.id);
  }
}
