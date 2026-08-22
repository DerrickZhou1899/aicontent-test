/**
 * Cau hinh Drizzle Kit.
 *
 * CHI dung `generate` + `migrate`. KHONG dung `drizzle-kit push`: push so sanh
 * schema roi tu sinh lenh, tren production no lang le DROP cot/bang de "cho
 * khop" — mat du lieu khong khoi phuc duoc. Xem `scripts/db-rollback.md`.
 */

import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('Thieu bien moi truong DATABASE_URL');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dbCredentials: { url },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
