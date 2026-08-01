import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDb() {
  const env = getRequestContext().env as { DB: any };
  if (!env.DB) {
    throw new Error('D1 database binding "DB" is not defined');
  }
  return drizzle(env.DB, { schema });
}
