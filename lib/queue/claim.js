'use strict';

/**
 * Lay viec ra khoi hang doi va ket so viec.
 *
 * `FOR UPDATE SKIP LOCKED` cho phep nhieu worker cung doc mot bang ma khong
 * cho nhau: hang nao dang bi khoa boi giao dich khac thi bo qua, khong xep hang
 * sau no. Khong co SKIP LOCKED thi worker thu hai dung im cho worker thu nhat —
 * gioi han dong thoi 2 tro thanh 1 ma khong ai thay.
 *
 * Viec treo (worker bi giet giua chung) tu tha khoa nho `locked_at`: khong co
 * moc thoi gian nay thi mot lan `kill -9` lam viec do ket o `dang_chay` vinh vien.
 */

/** Phu luc B muc 6.2 — gian cach sau lan chay hong thu 1, 2, 3. */
const GIAN_CACH_MS = [60_000, 300_000, 1_800_000];

/**
 * So lan chay toi da truoc khi chuyen han sang `loi`.
 * 1 lan dau + 3 lan thu lai = 4. Ba con so gian cach o tren ung voi ba lan thu lai.
 */
const SO_LAN_CHAY_TOI_DA = GIAN_CACH_MS.length + 1;

/** Viec giu khoa qua lau bi coi la treo. */
const PHUT_COI_LA_TREO = 15;

/**
 * Tha khoa cac viec treo. Goi truoc moi vong lay viec.
 *
 * Khong dat lai `so_lan_thu` ve 0: viec lam worker chet co the la viec doc, va
 * cho no chay lai vo han la bao worker chet mai mai.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} khachHang
 * @param {{ phutCoiLaTreo?: number, workspaceId?: string | null }} [thamSo]
 * @returns {Promise<string[]>} danh sach id viec da duoc tha
 */
async function thaKhoaViecTreo(khachHang, thamSo = {}) {
  const phut = thamSo.phutCoiLaTreo ?? PHUT_COI_LA_TREO;
  const workspaceId = thamSo.workspaceId ?? null;
  const ketQua = await khachHang.query(
    `UPDATE jobs
        SET trang_thai = 'cho',
            locked_by = NULL,
            locked_at = NULL,
            loi = COALESCE(loi, 'worker mat khoa qua ' || $1::int || ' phut, tha ra chay lai'),
            cap_nhat = now()
      WHERE trang_thai = 'dang_chay'
        AND locked_at < now() - make_interval(mins => $1::int)
        AND ($2::uuid IS NULL OR workspace_id = $2::uuid)
      RETURNING id`,
    [phut, workspaceId],
  );
  return ketQua.rows.map((h) => h.id);
}

/**
 * Lay dung mot viec dang cho va khoa no lai.
 *
 * `workspaceId` de trong nghia la nhan viec cua moi khong gian lam viec — day la
 * cach worker chay o san xuat. Ghim vao mot khong gian dung khi can rut viec cua
 * mot khach hang ma khong dung den hang doi chung, va la thu giu cac bo test
 * chay song song khong cuop viec cua nhau.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} khachHang
 * @param {{ lockedBy: string, loaiViec?: string[] | null, workspaceId?: string | null }} thamSo
 * @returns {Promise<null | {
 *   id: string, workspaceId: string, loaiViec: string,
 *   duLieuVao: Record<string, unknown>, soLanThu: number
 * }>}
 */
async function layViec(khachHang, thamSo) {
  const { lockedBy, loaiViec = null, workspaceId = null } = thamSo;
  if (!lockedBy) throw new Error('layViec: thieu lockedBy');

  const ketQua = await khachHang.query(
    `UPDATE jobs
        SET trang_thai = 'dang_chay',
            locked_by = $1,
            locked_at = now(),
            so_lan_thu = so_lan_thu + 1,
            cap_nhat = now()
      WHERE id = (
            SELECT id FROM jobs
             WHERE trang_thai = 'cho'
               AND thoi_diem_chay <= now()
               AND ($2::text[] IS NULL OR loai_viec::text = ANY($2::text[]))
               AND ($3::uuid IS NULL OR workspace_id = $3::uuid)
             ORDER BY thoi_diem_chay, ngay_tao
             FOR UPDATE SKIP LOCKED
             LIMIT 1
      )
      RETURNING id, workspace_id, loai_viec, du_lieu_vao, so_lan_thu`,
    [lockedBy, loaiViec, workspaceId],
  );

  if (ketQua.rowCount === 0) return null;
  const hang = ketQua.rows[0];
  return {
    id: hang.id,
    workspaceId: hang.workspace_id,
    loaiViec: hang.loai_viec,
    duLieuVao: hang.du_lieu_vao ?? {},
    soLanThu: hang.so_lan_thu,
  };
}

/**
 * Danh dau viec xong. Ghi ket qua vao cot `ket_qua`.
 */
async function ghiNhanXong(khachHang, jobId, ketQua) {
  await khachHang.query(
    `UPDATE jobs
        SET trang_thai = 'xong', ket_qua = $2::jsonb, loi = NULL,
            locked_by = NULL, locked_at = NULL, cap_nhat = now()
      WHERE id = $1`,
    [jobId, JSON.stringify(ketQua ?? {})],
  );
}

/**
 * Danh dau viec hong. Con luot thi hen chay lai co gian cach, het luot thi `loi`.
 *
 * Nguoi goi truyen `soLanThu` lay tu chinh ban ghi da khoa — tinh o JavaScript
 * chu khong nhet CASE WHEN vao SQL de con test duoc bang mot ham thuan.
 *
 * @returns {Promise<{ trangThai: 'cho' | 'loi', doiThemMs: number }>}
 */
async function ghiNhanLoi(khachHang, thamSo) {
  const { jobId, soLanThu, loi } = thamSo;
  const quyet = quyetDinhThuLai(soLanThu);

  await khachHang.query(
    `UPDATE jobs
        SET trang_thai = $2::trang_thai_job,
            thoi_diem_chay = now() + make_interval(secs => $3::double precision),
            loi = $4,
            locked_by = NULL, locked_at = NULL, cap_nhat = now()
      WHERE id = $1`,
    [jobId, quyet.trangThai, quyet.doiThemMs / 1000, String(loi ?? '').slice(0, 4000)],
  );

  return quyet;
}

/**
 * Ham thuan: lan chay thu `soLanThu` vua hong thi lam gi tiep.
 * @param {number} soLanThu
 * @returns {{ trangThai: 'cho' | 'loi', doiThemMs: number }}
 */
function quyetDinhThuLai(soLanThu) {
  if (soLanThu >= SO_LAN_CHAY_TOI_DA) return { trangThai: 'loi', doiThemMs: 0 };
  return { trangThai: 'cho', doiThemMs: GIAN_CACH_MS[soLanThu - 1] ?? GIAN_CACH_MS[0] };
}

module.exports = {
  GIAN_CACH_MS,
  PHUT_COI_LA_TREO,
  SO_LAN_CHAY_TOI_DA,
  ghiNhanLoi,
  ghiNhanXong,
  layViec,
  quyetDinhThuLai,
  thaKhoaViecTreo,
};
