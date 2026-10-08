import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginacaoQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

export interface Pagina<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const calcularSkip = (page: number, limit: number) => (page - 1) * limit;

export function montarPagina<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Pagina<T> {
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
