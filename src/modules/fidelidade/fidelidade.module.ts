import { Module } from '@nestjs/common';
import { FidelidadeController } from './api/fidelidade.controller';
import { FidelidadeService } from './application/fidelidade.service';
import { FidelidadeRepository } from './infrastructure/fidelidade.repository';

@Module({
  controllers: [FidelidadeController],
  providers: [FidelidadeService, FidelidadeRepository],
  exports: [FidelidadeService],
})
export class FidelidadeModule {}
