import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CanalPedido, StatusPedido } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginacaoQueryDto } from '../../../shared/pagination/paginacao.dto';

export class ItemPedidoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  produtoId: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CriarPedidoDto {
  @ApiProperty({
    enum: CanalPedido,
    example: 'TOTEM',
    description: 'Canal de origem (obrigatório).',
  })
  @IsEnum(CanalPedido, {
    message: 'canalPedido deve ser um de: APP, TOTEM, BALCAO, PICKUP, WEB',
  })
  canalPedido: CanalPedido;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  unidadeId: number;

  @ApiPropertyOptional({
    example: 5,
    description:
      'Obrigatório para ATENDENTE/GERENTE/ADMIN. Para CLIENTE, é o próprio usuário do token.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number;

  @ApiProperty({ type: [ItemPedidoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens: ItemPedidoDto[];

  @ApiProperty({
    example: 'MOCK',
    enum: ['MOCK', 'PIX', 'CARTAO'],
    description: 'Todas processadas pelo gateway mock.',
  })
  @IsIn(['MOCK', 'PIX', 'CARTAO'], {
    message: 'formaPagamento deve ser MOCK, PIX ou CARTAO',
  })
  formaPagamento: string;

  @ApiPropertyOptional({ example: 'BEMVINDO10' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  codigoPromocao?: string;

  @ApiPropertyOptional({
    example: 50,
    description:
      'Pontos a resgatar (1 ponto = R$ 0,10). Somente CLIENTE, com consentimento.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pontosResgatar?: number;
}

export class AtualizarStatusDto {
  @ApiProperty({ enum: StatusPedido, example: 'EM_PREPARO' })
  @IsEnum(StatusPedido, { message: 'status inválido' })
  status: StatusPedido;
}

export class ListarPedidosQueryDto extends PaginacaoQueryDto {
  @ApiPropertyOptional({ enum: CanalPedido })
  @IsOptional()
  @IsEnum(CanalPedido, {
    message: 'canalPedido deve ser um de: APP, TOTEM, BALCAO, PICKUP, WEB',
  })
  canalPedido?: CanalPedido;

  @ApiPropertyOptional({ enum: StatusPedido })
  @IsOptional()
  @IsEnum(StatusPedido, { message: 'status inválido' })
  status?: StatusPedido;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unidadeId?: number;
}
