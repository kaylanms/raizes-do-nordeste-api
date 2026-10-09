import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class SolicitarPagamentoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  pedidoId: number;

  @ApiPropertyOptional({
    enum: ['APROVAR', 'RECUSAR', 'INDISPONIVEL'],
    description:
      'SOMENTE PARA TESTES: força o resultado do gateway mock. Sem o campo, o pagamento é aprovado.',
  })
  @IsOptional()
  @IsIn(['APROVAR', 'RECUSAR', 'INDISPONIVEL'], {
    message: 'simulacao deve ser APROVAR, RECUSAR ou INDISPONIVEL',
  })
  simulacao?: 'APROVAR' | 'RECUSAR' | 'INDISPONIVEL';
}
