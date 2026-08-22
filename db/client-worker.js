'use strict';

/**
 * Be ket noi PostgreSQL cho hang doi va worker.
 *
 * Vi sao khong dung `db/client.ts`: file do la be ket noi Drizzle cua TIEN TRINH
 * WEB va viet bang TypeScript. Worker chay bang `node` tran duoi pm2, Node 20
 * khong doc duoc `.ts`, nen hang doi phai co duong ket noi rieng bang `pg`.
 *
 * Worker dung `DATABASE_URL_WORKER` (vai tro bo qua phan quyen theo hang cua
 * Phase 13); tien trinh web dung `DATABASE_URL`. Hai chuoi tach nhau la co chu
 * y — tien trinh web tuyet doi khong duoc cam chuoi cua worker.
 */

const { Pool } = require('pg');

/** @type {Map<string, import('pg').Pool>} */
const be = new Map();

/**
 * @param {string} [tenBien] ten bien moi truong chua chuoi ket noi
 * @returns {import('pg').Pool}
 */
function beKetNoi(tenBien = 'DATABASE_URL') {
  const dangCo = be.get(tenBien);
  if (dangCo) return dangCo;

  const chuoi = process.env[tenBien];
  // Chet ngay luc mo ket noi con hon chet giua mot truy van sau nay.
  if (!chuoi) throw new Error(`Thieu bien moi truong ${tenBien}`);

  const moi = new Pool({
    connectionString: chuoi,
    max: Number(process.env.QUEUE_POOL_MAX || 6),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Loi cua ket noi dang ranh khong gan voi truy van nao; khong bat o day thi no
  // thanh uncaughtException va giet ca tien trinh worker.
  moi.on('error', (loi) => {
    console.error(`[hang-doi] loi ket noi nhan roi (${tenBien}):`, loi.message);
  });

  be.set(tenBien, moi);
  return moi;
}

async function dongBeKetNoi() {
  const dang = [...be.values()];
  be.clear();
  await Promise.all(dang.map((b) => b.end().catch(() => {})));
}

module.exports = { beKetNoi, dongBeKetNoi };
