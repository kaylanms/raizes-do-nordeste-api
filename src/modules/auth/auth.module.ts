import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
@Module({
  imports: [
    UsuariosModule,
    JwtModule.register({
      global: true,
      secret: 'troque_este_segredo_use_um_valor_longo_e_aleatorio',
      signOptions: { expiresIn: 3600 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
