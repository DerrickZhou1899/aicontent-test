'use strict';

/**
 * Day viec vao bang `jobs`.
 *
 * Chan chay trung dat o TANG CO SO DU LIEU (`UNIQUE (jobs.idempotency_key)`),
 * khong phai o mot cau `if` trong ma nguon. Ly do: hai tien trinh worker hoac
 * hai lan bam nut cach nhau vai mili giay deu vuot qua duoc mot cau `if`, con
 * khoa duy nhat thi khong. Viec keo so lieu Apify tinh tien theo luot chay nen
 * mot lan trung la mat tien that.
 *
 * Cac ham o day nhan `khachHang` la mot `pg.Pool` hoac `pg.PoolClient` de goi
 * duoc ca ben trong mot giao dich dang mo.
 */

const crypto = require('node:crypto');

/**
 * Chuan hoa gia tri truoc khi bam: JSON.stringify khong bao dam thu tu khoa,
 * ma thu tu khoa khac nhau se cho ra hai khoa chong trung khac nhau cho cung
 * mot viec — dung nghia la mat tac dung chan trung.
 */
function chuanHoaDeBam(giaTri) {
  if (giaTri === null || typeof giaTri !== 'object') return giaTri;
  if (Array.isArray(giaTri)) return giaTri.map(chuanHoaDeBam);
  const ketQua = {};
  for (const khoa of Object.keys(giaTri).sort()) {
    ketQua[khoa] = chuanHoaDeBam(giaTri[khoa]);
  }
  return ketQua;
}

/**
 * Sinh khoa chong trung on dinh tu (workspace, loai viec, du lieu vao).
 *
 * Viec keo so lieu KHONG dung ham nay ma tu dat khoa `content_id + moc` — cung
 * mot noi dung, cung moc T+7 chi duoc keo mot lan du hang doi bi day lai bao
 * nhieu lan (Phu luc B muc 6.2).
 */
function sinhKhoaChongTrung(workspaceId, loaiViec, duLieuVao) {
  const chuoi = JSON.stringify([workspaceId, loaiViec, chuanHoaDeBam(duLieuVao ?? {})]);
  return `${loaiViec}:${crypto.createHash('sha256').update(chuoi).digest('hex').slice(0, 32)}`;
}

/**
 * Day mot viec vao hang doi.
 *
 * Tra ve `{ jobId, moi }`. `moi === false` nghia la da co viec cung khoa chong
 * trung — nguoi goi nen dung lai jobId do chu khong coi la loi.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} khachHang
 * @param {{
 *   workspaceId: string,
 *   loaiViec: string,
 *   duLieuVao?: Record<string, unknown>,
 *   khoaChongTrung?: string | null,
 *   thoiDiemChay?: Date | null,
 * }} thamSo
 */
async function dayViec(khachHang, thamSo) {
  const {
    workspaceId,
    loaiViec,
    duLieuVao = {},
    khoaChongTrung = null,
    thoiDiemChay = null,
  } = thamSo;

  if (!workspaceId) throw new Error('dayViec: thieu workspaceId');
  if (!loaiViec) throw new Error('dayViec: thieu loaiViec');

  // ON CONFLICT DO NOTHING chi de KHONG nem loi len nguoi goi; thu chan trung
  // van la rang buoc duy nhat cua PostgreSQL. Bo dong nay di thi lan day thu
  // hai bao loi 23505 chu khong hai lan cung chay.
  const them = await khachHang.query(
    `INSERT INTO jobs (workspace_id, loai_viec, du_lieu_vao, idempotency_key, thoi_diem_chay)
     VALUES ($1, $2, $3::jsonb, $4, COALESCE($5::timestamptz, now()))
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [workspaceId, loaiViec, JSON.stringify(duLieuVao), khoaChongTrung, thoiDiemChay],
  );

  if (them.rowCount === 1) return { jobId: them.rows[0].id, moi: true };

  const daCo = await khachHang.query(
    'SELECT id FROM jobs WHERE idempotency_key = $1',
    [khoaChongTrung],
  );
  if (daCo.rowCount === 1) return { jobId: daCo.rows[0].id, moi: false };

  // Khong chen duoc ma cung khong tim thay ban ghi cu: khoa chong trung la NULL
  // (NULL khong bao gio dung do trong khoa duy nhat) thi khong the roi vao day.
  throw new Error('dayViec: khong chen duoc viec va cung khong tim thay viec cu');
}

module.exports = { dayViec, sinhKhoaChongTrung };
