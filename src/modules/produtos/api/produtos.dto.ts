import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginacaoQueryDto } from '../../../shared/pagination/paginacao.dto';

export class CriarProdutoDto {
  @ApiProperty({ example: 'Carne de Sol com Macaxeira' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({
    example: 'Carne de sol acebolada com macaxeira cozida',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 'Pratos' })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({ example: 42.9 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  precoBase: number;
}

export class AtualizarProdutoDto extends PartialType(CriarProdutoDto) {}

export class ListarProdutosQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({ example: 'Pratos' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ example: 'tapioca' })
  @IsOptional()
  @IsString()
  busca?: string;
}
