import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
  },

  engine: 'classic',

  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://raizes:raizes123@localhost:5433/raizes_db?schema=public',
  },
});
