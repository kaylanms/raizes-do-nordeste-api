import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordHasher {
  private readonly rounds = 10;

  hash(senha: string): Promise<string> {
    return bcrypt.hash(senha, this.rounds);
  }

  comparar(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }
}
