import { Module } from '@nestjs/common';
import { UnidadesController } from './api/unidades.controller';
import { UnidadesService } from './application/unidades.service';
import { UnidadesRepository } from './infrastructure/unidades.repository';

@Module({
  controllers: [UnidadesController],
  providers: [UnidadesService, UnidadesRepository],
  exports: [UnidadesService],
})
export class UnidadesModule {}
