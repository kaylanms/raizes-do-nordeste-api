import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErroPadraoDto } from '../errors/erro-padrao.dto';

const DESCRICOES: Record<number, string> = {
  400: 'Requisição malformada',
  401: 'Não autenticado (token ausente, inválido ou expirado)',
  403: 'Perfil sem permissão ou unidade não permitida',
  404: 'Recurso não encontrado',
  409: 'Conflito / regra de negócio violada',
  422: 'Erro de validação dos dados',
  503: 'Serviço externo indisponível',
};

export const ApiErros = (...codigos: number[]) =>
  applyDecorators(
    ...codigos.map((status) =>
      ApiResponse({
        status,
        description: DESCRICOES[status] ?? 'Erro',
        type: ErroPadraoDto,
      }),
    ),
  );
