import { defineConfig } from 'prisma/config';
import path from 'node:path';

function resolveSchemaRelativeSqliteUrl(databaseUrl: string): string {
  if (!databaseUrl.startsWith('file:')) {
    return databaseUrl;
  }

  const urlWithoutPrefix = databaseUrl.slice('file:'.length);
  if (urlWithoutPrefix === ':memory:') {
    return ':memory:';
  }

  const [sqlitePath, query] = urlWithoutPrefix.split('?');
  const absolutePath = path.isAbsolute(sqlitePath)
    ? sqlitePath
    : path.resolve(process.cwd(), 'prisma', sqlitePath);
  return `file:${absolutePath}${query ? `?${query}` : ''}`;
}

const databaseUrl = resolveSchemaRelativeSqliteUrl(
  process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: databaseUrl
  }
});
