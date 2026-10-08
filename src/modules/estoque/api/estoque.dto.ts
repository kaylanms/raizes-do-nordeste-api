import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginacaoQueryDto } from '../../../shared/pagination/paginacao.dto';

export class MovimentarEstoqueDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  unidadeId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  produtoId: number;

  @ApiProperty({ enum: ['ENTRADA', 'SAIDA'], example: 'ENTRADA' })
  @IsIn(['ENTRADA', 'SAIDA'])
  tipo: 'ENTRADA' | 'SAIDA';

  @ApiProperty({ example: 20, minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional({ example: 'Reposição semanal' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motivo?: string;
}

export class ConsultarEstoqueQueryDto extends PaginacaoQueryDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unidadeId: number;
}
