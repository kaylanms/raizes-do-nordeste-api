import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/guards/decorators';
import { AuthService } from '../application/auth.service';
import { LoginDto } from './auth.dto';
import { ApiErros } from '../../../shared/swagger/api-erros.decorator';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica o usuário e retorna o token JWT' })
  @ApiErros(401, 422)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }
}
