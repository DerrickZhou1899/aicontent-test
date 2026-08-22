'use strict';

/**
 * Tro giup cho cac bo test cham co so du lieu.
 *
 * KHONG dat ten `*.test.js` de `node --test tests/` khong chay tep nay nhu mot
 * bo test.
 */

require('dotenv/config');

const crypto = require('node:crypto');
const { Pool } = require('pg');

/** Ten co so du lieu THAT. Bo test o day XOA du lieu, khong bao gio duoc cham vao. */
const CSDL_CAM = new Set(['aicontent']);

function tenCsdl(chuoiKetNoi) {
  try {
    return new URL(chuoiKetNoi).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
}

/**
 * Mo be ket noi cho test. Nem loi neu tro nham vao co so du lieu that.
 * @returns {import('pg').Pool}
 */
function beTest() {
  const chuoi = process.env.DATABASE_URL;
  if (!chuoi) throw new Error('Thieu DATABASE_URL — bo test can .env cua worktree');
  const ten = tenCsdl(chuoi);
  if (CSDL_CAM.has(ten)) {
    throw new Error(`Bo test tu choi chay tren co so du lieu that "${ten}"`);
  }
  return new Pool({ connectionString: chuoi, max: 8 });
}

/**
 * Tao mot khong gian lam viec dung rieng cho mot bo test.
 * @param {import('pg').Pool} be
 * @returns {Promise<{ workspaceId: string, userId: string, don: () => Promise<void> }>}
 */
async function taoKhongGianTam(be, nhan = 'test') {
  const dauVet = crypto.randomBytes(6).toString('hex');
  const nguoi = await be.query(
    "INSERT INTO users (ten, email) VALUES ($1, $2) RETURNING id",
    [`test ${nhan}`, `test-${nhan}-${dauVet}@vi-du.invalid`],
  );
  const userId = nguoi.rows[0].id;
  const khongGian = await be.query(
    'INSERT INTO workspaces (ten, chu_so_huu_id) VALUES ($1, $2) RETURNING id',
    [`khong gian test ${nhan} ${dauVet}`, userId],
  );
  const workspaceId = khongGian.rows[0].id;

  async function don() {
    // workspace_id la khoa ngoai ON DELETE CASCADE o jobs / model_runs /
    // cost_log nen xoa khong gian la don sach ca ba bang.
    await be.query('DELETE FROM workspaces WHERE id = $1', [workspaceId]);
    await be.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  return { workspaceId, userId, don };
}

module.exports = { beTest, taoKhongGianTam, tenCsdl };
