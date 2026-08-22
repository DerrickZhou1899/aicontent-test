/**
 * Kiem thu tich hop cua Phase 6 — chay voi may chu that va CSDL that.
 *
 * Khong gia lap: tat ca tieu chi quan trong cua phase nay (middleware co nuot
 * /healthz khong, phien co thu hoi duoc khong) chi co nghia khi di het duong
 * HTTP -> middleware -> Auth.js -> Drizzle -> PostgreSQL. Gia lap mot mat xich
 * la kiem thu chinh thu minh vua viet.
 *
 * Chay:
 *   PORT=6982 npm run dev        # hoac npm run build && PORT=6982 npm start
 *   npm test
 *
 * Khong co may chu -> ca tep tu bo qua (chu khong bao dat).
 */

import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';

import pg from 'pg';

const GOC = process.env.AICONTENT_TEST_URL ?? process.env.AUTH_URL ?? 'http://127.0.0.1:6982';

// Auth.js them tien to __Secure- khi URL la https (xem defaultCookies trong
// @auth/core). Suy ra tu URL chu khong viet cung, de test dung ca hai moi truong.
const TEN_COOKIE = new URL(GOC).protocol === 'https:'
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token';

let mayChuSong = false;
let pool;
/** @type {{ userId: string, workspaceId: string, email: string, token: string }} */
let hatGiong;

async function goi(duongDan, cookie) {
  return fetch(new URL(duongDan, GOC), {
    redirect: 'manual',
    headers: cookie ? { cookie: `${TEN_COOKIE}=${cookie}` } : {},
  });
}

/** Next rut gon Location cung goc thanh duong dan tuong doi, nen phai co goc de phan giai. */
function duongDanChuyenHuong(res) {
  return new URL(res.headers.get('location'), GOC).pathname;
}

before(async () => {
  try {
    const thu = await fetch(new URL('/healthz', GOC), { signal: AbortSignal.timeout(3000) });
    mayChuSong = thu.ok;
  } catch {
    mayChuSong = false;
  }
  if (!mayChuSong) return;

  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

  const email = `phase06-${randomUUID()}@example.invalid`;
  const token = randomBytes(32).toString('hex');

  const { rows: nguoiDung } = await pool.query(
    'INSERT INTO users (ten, email) VALUES ($1, $2) RETURNING id',
    ['Kiem thu Phase 6', email],
  );
  const userId = nguoiDung[0].id;

  const { rows: khongGian } = await pool.query(
    'INSERT INTO workspaces (ten, chu_so_huu_id) VALUES ($1, $2) RETURNING id',
    ['Khong gian kiem thu', userId],
  );
  const workspaceId = khongGian[0].id;

  await pool.query(
    "INSERT INTO workspace_members (workspace_id, user_id, vai_tro) VALUES ($1, $2, 'chu_so_huu')",
    [workspaceId, userId],
  );
  await pool.query(
    "INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, now() + interval '1 hour')",
    [token, userId],
  );

  hatGiong = { userId, workspaceId, email, token };
});

after(async () => {
  if (!pool) return;
  if (hatGiong) {
    // Xoa theo thu tu nguoc chieu khoa ngoai; users xoa cuoi vi workspaces tham
    // chieu chu_so_huu_id voi onDelete restrict.
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [hatGiong.userId]);
    await pool.query('DELETE FROM workspace_members WHERE user_id = $1', [hatGiong.userId]);
    await pool.query('DELETE FROM workspaces WHERE chu_so_huu_id = $1', [hatGiong.userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [hatGiong.userId]);
  }
  await pool.end();
});

describe('middleware khi chua dang nhap', () => {
  it('/healthz van tra 200 JSON — middleware KHONG duoc nuot health check', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const res = await goi('/healthz');
    // scripts/auto-deploy.sh dung `curl -fsS` — curl coi 307 la thanh cong, nen
    // neu middleware doi /healthz thanh 307 sang /dang-nhap thi health check
    // xanh vinh vien ke ca khi app da chet. Khang dinh dung 200, khong phai 2xx/3xx.
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /application\/json/);
    assert.equal((await res.json()).ok, true);
  });

  it('/templates bi day sang /dang-nhap', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const res = await goi('/templates');
    assert.equal(res.status, 307);
    assert.equal(duongDanChuyenHuong(res), '/dang-nhap');
  });

  it('/dang-nhap mo duoc, khong lap vo han', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const res = await goi('/dang-nhap');
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Đăng nhập bằng Google/);
  });

  it('/api/auth/* khong bi middleware chan (khong thi khong ai dang nhap duoc)', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const res = await goi('/api/auth/providers');
    assert.equal(res.status, 200);
    assert.equal((await res.json()).google?.id, 'google');
  });

  it('duong khong ro trong (dash) cung bi chan — matcher chan mac dinh', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const res = await goi('/mot-man-hinh-chua-ton-tai');
    assert.equal(res.status, 307);
    assert.equal(duongDanChuyenHuong(res), '/dang-nhap');
  });
});

describe('phien luu trong CSDL', () => {
  it('cookie phien hop le thi vao duoc /templates', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const res = await goi('/templates', hatGiong.token);
    assert.equal(res.status, 200);
  });

  it('/api/auth/session tra dung nguoi + workspace, va KHONG lo session_token', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const res = await goi('/api/auth/session', hatGiong.token);
    assert.equal(res.status, 200);
    const than = await res.text();

    // Cookie phien la httpOnly; tra session_token ra day cho JavaScript doc duoc
    // thi httpOnly con lai vo nghia.
    assert.equal(than.includes(hatGiong.token), false);

    const phien = JSON.parse(than);
    assert.equal(phien.user.id, hatGiong.userId);
    assert.equal(phien.user.email, hatGiong.email);
    assert.equal(phien.workspaceId, hatGiong.workspaceId);
  });

  // Day la bai kiem tra chung minh phien THU HOI DUOC. The tu chua (JWT) se van
  // cho vao sau khi dong nay bien mat, va do la ly do phase nay chon strategy
  // 'database'.
  it('xoa dong sessions -> lan tai trang sau bi da ve /dang-nhap', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    await pool.query('DELETE FROM sessions WHERE session_token = $1', [hatGiong.token]);

    const res = await goi('/templates', hatGiong.token);
    assert.equal(res.status, 307);
    assert.equal(duongDanChuyenHuong(res), '/dang-nhap');
  });

  it('phien het han bi tu choi va bi don khoi CSDL', async (t) => {
    if (!mayChuSong) return t.skip(`khong ket noi duoc ${GOC}`);

    const tokenCu = randomBytes(32).toString('hex');
    await pool.query(
      "INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, now() - interval '1 minute')",
      [tokenCu, hatGiong.userId],
    );

    const res = await goi('/templates', tokenCu);
    assert.equal(res.status, 307);

    const { rows } = await pool.query('SELECT 1 FROM sessions WHERE session_token = $1', [tokenCu]);
    assert.equal(rows.length, 0);
  });
});
