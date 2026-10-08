import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { CurrentUser, Roles } from '../../../shared/guards/decorators';
import type { UsuarioAutenticado } from '../../../shared/guards/usuario-autenticado';
import { ProdutosService } from '../application/produtos.service';
import {
  AtualizarProdutoDto,
  CriarProdutoDto,
  ListarProdutosQueryDto,
} from './produtos.dto';

@ApiTags('Produtos')
@ApiBearerAuth()
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly service: ProdutosService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista produtos (paginado, com filtros por categoria e busca)',
  })
  listar(@Query() q: ListarProdutosQueryDto) {
    return this.service.listar(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um produto' })
  obter(@Param('id', ParseIntPipe) id: number) {
    return this.service.obterView(id);
  }

  @Post()
  @Roles(Perfil.ADMIN, Perfil.GERENTE)
  @ApiOperation({ summary: 'Cadastra um produto (ADMIN, GERENTE)' })
  criar(@Body() dto: CriarProdutoDto, @CurrentUser() user: UsuarioAutenticado) {
    return this.service.criar(dto, user.id);
  }

  @Patch(':id')
  @Roles(Perfil.ADMIN, Perfil.GERENTE)
  @ApiOperation({ summary: 'Atualiza um produto (ADMIN, GERENTE)' })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarProdutoDto,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.service.atualizar(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Perfil.ADMIN)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Desativa um produto (exclusão lógica, somente ADMIN)',
  })
  async desativar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    await this.service.desativar(id, user.id);
  }
}
