import { Module } from '@nestjs/common';
import { UsuariosController } from './api/usuarios.controller';
import { UsuariosService } from './application/usuarios.service';
import { PasswordHasher } from './infrastructure/password-hasher';
import { UsuariosRepository } from './infrastructure/usuarios.repository';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepository, PasswordHasher],
  exports: [UsuariosRepository, PasswordHasher],
})
export class UsuariosModule {}
