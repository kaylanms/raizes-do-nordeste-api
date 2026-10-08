import { HttpException } from '@nestjs/common';

export interface DetalheErro {
  field: string;
  issue: string;
}

export class AppException extends HttpException {
  constructor(
    status: number,
    public readonly codigo: string,
    message: string,
    public readonly detalhes: DetalheErro[] = [],
  ) {
    super({ error: codigo, message, details: detalhes }, status);
  }
}
