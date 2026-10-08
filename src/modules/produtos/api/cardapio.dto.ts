import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class DefinirItemCardapioDto {
  @ApiProperty({
    example: 41.9,
    description: 'Preço do produto nesta unidade.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  preco: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  disponivel?: boolean;
}
