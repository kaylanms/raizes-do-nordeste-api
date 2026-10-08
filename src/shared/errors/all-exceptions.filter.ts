import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException, DetalheErro } from './app.exception';

const CODIGOS_HTTP: Record<number, string> = {
  400: 'REQUISICAO_INVALIDA',
  401: 'NAO_AUTENTICADO',
  403: 'ACESSO_NEGADO',
  404: 'NAO_ENCONTRADO',
  405: 'METODO_NAO_PERMITIDO',
  409: 'CONFLITO',
  422: 'VALIDACAO_INVALIDA',
  429: 'MUITAS_REQUISICOES',
};

interface ErroTraduzido {
  status: number;
  error: string;
  message: string;
  details: DetalheErro[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erros');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const erro = this.traduzir(exception);

    if (erro.status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(erro.status).json({
      error: erro.error,
      message: erro.message,
      details: erro.details,
      timestamp: new Date().toISOString(),
      path: String(req.originalUrl ?? req.url).split('?')[0],
      requestId: req.requestId,
    });
  }

  private traduzir(e: unknown): ErroTraduzido {
    if (e instanceof AppException) {
      return {
        status: e.getStatus(),
        error: e.codigo,
        message: e.message,
        details: e.detalhes,
      };
    }

    if (e instanceof HttpException) {
      const status = e.getStatus();
      const corpo: any = e.getResponse();
      const message =
        typeof corpo === 'string'
          ? corpo
          : Array.isArray(corpo?.message)
            ? corpo.message.join('; ')
            : (corpo?.message ?? e.message);
      return {
        status,
        error: CODIGOS_HTTP[status] ?? 'ERRO_HTTP',
        message,
        details: [],
      };
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      switch (e.code) {
        case 'P2002':
          return {
            status: 409,
            error: 'REGISTRO_DUPLICADO',
            message: 'Já existe um registro com estes dados.',
            details: [],
          };
        case 'P2025':
          return {
            status: 404,
            error: 'NAO_ENCONTRADO',
            message: 'Registro não encontrado.',
            details: [],
          };
        case 'P2003':
        case 'P2004':
          return {
            status: 409,
            error: 'VIOLACAO_DE_INTEGRIDADE',
            message: 'A operação viola uma regra de integridade dos dados.',
            details: [],
          };
      }
    }

    // Nunca vaza detalhes internos para o cliente
    return {
      status: 500,
      error: 'ERRO_INTERNO',
      message: 'Erro interno do servidor.',
      details: [],
    };
  }
}
