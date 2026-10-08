import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CadastrarUsuarioDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @ApiProperty({ example: 'maria.nova@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'De 8 a 72 caracteres, com letras e números.',
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/, {
    message: 'A senha deve ter de 8 a 72 caracteres, com letras e números.',
  })
  senha: string;
}
