import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CriarUnidadeDto {
  @ApiProperty({ example: 'Unidade Natal' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'Natal' })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({
    example: 'RN',
    description: 'Sigla da UF, 2 letras maiúsculas.',
  })
  @Matches(/^[A-Z]{2}$/, { message: 'uf deve ter 2 letras maiúsculas' })
  uf: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  matriz?: boolean;
}
