import { ValidationError } from 'class-validator';
import { AppException, DetalheErro } from './app.exception';

function achatar(erros: ValidationError[], prefixo = ''): DetalheErro[] {
  return erros.flatMap((e) => {
    const campo = prefixo ? `${prefixo}.${e.property}` : e.property;
    const proprios = Object.values(e.constraints ?? {}).map((issue) => ({
      field: campo,
      issue,
    }));
    return [...proprios, ...achatar(e.children ?? [], campo)];
  });
}

export const criarErroValidacao = (erros: ValidationError[]) =>
  new AppException(
    422,
    'VALIDACAO_INVALIDA',
    'Dados da requisição inválidos.',
    achatar(erros),
  );
