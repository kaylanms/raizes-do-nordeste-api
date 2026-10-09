import { ApiProperty } from '@nestjs/swagger';

export class DetalheErroDto {
  @ApiProperty({ example: 'itens.0.quantidade' })
  field: string;

  @ApiProperty({ example: 'quantidade must not be less than 1' })
  issue: string;
}

export class ErroPadraoDto {
  @ApiProperty({ example: 'ESTOQUE_INSUFICIENTE' })
  error: string;

  @ApiProperty({
    example: 'Não há quantidade suficiente para um ou mais itens.',
  })
  message: string;

  @ApiProperty({ type: [DetalheErroDto] })
  details: DetalheErroDto[];

  @ApiProperty({ example: '2026-10-09T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/pedidos' })
  path: string;

  @ApiProperty({
    example: '0b1c2d3e-0000-4000-8000-000000000000',
    required: false,
  })
  requestId?: string;
}
