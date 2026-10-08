import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: 'postgresql://raizes:RaizesDB2026Macae@127.0.0.1:5433/raizes_db?schema=public',
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
