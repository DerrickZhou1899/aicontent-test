/**
 * Be ket noi PostgreSQL + phien ban Drizzle dung chung.
 *
 * File nay CHI mo ket noi. Moi truy van nghiep vu phai di qua tang truy cap du
 * lieu (Phase 5) — tang do bat buoc nhan `workspaceId`, la thu chan ro du lieu
 * cheo giua cac khong gian lam viec.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index';

function docChuoiKetNoi(ten: string): string {
  const giaTri = process.env[ten];
  if (!giaTri) {
    // Chet ngay luc khoi dong con hon chet giua mot truy van sau nay.
    throw new Error(`Thieu bien moi truong ${ten}`);
  }
  return giaTri;
}

/**
 * Worker nen goi ham nay voi DATABASE_URL_WORKER (vai tro bo qua phan quyen
 * theo hang); tien trinh web tuyet doi khong duoc dung chuoi ket noi do.
 */
export function taoKetNoi(chuoiKetNoi: string) {
  const pool = new Pool({
    connectionString: chuoiKetNoi,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Loi cua ket noi dang ranh khong gan voi truy van nao; khong bat o day thi
  // no thanh uncaughtException va giet ca tien trinh.
  pool.on('error', (loi) => {
    console.error('[db] loi ket noi nhan roi:', loi.message);
  });

  return { pool, db: drizzle(pool, { schema }) };
}

const ketNoiUngDung = taoKetNoi(docChuoiKetNoi('DATABASE_URL'));

export const pool = ketNoiUngDung.pool;
export const db = ketNoiUngDung.db;
export { schema };
