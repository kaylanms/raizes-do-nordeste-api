import { Module } from '@nestjs/common';
import { AuditoriaController } from './api/auditoria.controller';
import { AuditoriaService } from './application/auditoria.service';
import { AuditoriaRepository } from './infrastructure/auditoria.repository';

@Module({
  controllers: [AuditoriaController],
  providers: [AuditoriaService, AuditoriaRepository],
})
export class AuditoriaModule {}
