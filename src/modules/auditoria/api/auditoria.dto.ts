import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginacaoQueryDto } from '../../../shared/pagination/paginacao.dto';

export class ListarAuditoriaQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({ example: 'PEDIDO_CRIADO' })
  @IsOptional()
  @IsString()
  acao?: string;

  @ApiPropertyOptional({ example: 'Pedido' })
  @IsOptional()
  @IsString()
  entidade?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entidadeId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;
}
