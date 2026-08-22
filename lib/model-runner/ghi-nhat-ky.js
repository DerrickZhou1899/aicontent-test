'use strict';

/**
 * Ghi `model_runs` + `cost_log` cho MOI lan goi mo hinh, ke ca lan that bai.
 *
 * PRD muc 12.3: nhat ky chi phi theo tung nguoi dung phai co tu V1 du V1 chi co
 * mot nguoi dung. Sau 1-2 thang moi co con so that "mot nguoi dung tieu bao
 * nhieu mot thang" — day la can cu duy nhat de dat gia ma khong lo. Bo qua lan
 * that bai la bo qua dung phan ton tien ma khong ra ket qua.
 *
 * Hai bang ghi trong CUNG mot giao dich voi nguoi goi neu nguoi goi truyen vao
 * mot `PoolClient` dang mo giao dich; khong thi hai lenh chen roi nhau va co the
 * co `model_runs` ma thieu `cost_log`.
 */

/**
 * Don gia UOC TINH, dong tren 1000 ky tu (vao + ra).
 *
 * Vi sao la uoc tinh: dong lenh KHONG tra ve chi phi tung yeu cau, va ca hai
 * duong dan hien tai deu la thue bao dong ca nhan — chi phi bien thuc te cua
 * mot luot goi bang 0 cho toi khi cham tran thue bao. Con so o day quy doi phan
 * thue bao ra tung luot goi de con so sanh duoc giua cac nhiem vu va giua cac
 * thang. Hieu chinh lai khi co du lieu that, va thay han khi bat runner-api.js.
 */
const DON_GIA_VND_TREN_1K_KY_TU = {
  'claude-cli': 12,
  'codex-cli': 4,
};

const DON_GIA_MAC_DINH = 8;

/**
 * @param {number} doDaiVao
 * @param {number} doDaiRa
 * @param {string} moHinh
 * @returns {{ soLuong: number, chiPhiUocTinh: number }}
 */
function tinhChiPhiUocTinh(doDaiVao, doDaiRa, moHinh) {
  const soLuong = ((Number(doDaiVao) || 0) + (Number(doDaiRa) || 0)) / 1000;
  const donGia = DON_GIA_VND_TREN_1K_KY_TU[moHinh] ?? DON_GIA_MAC_DINH;
  return {
    soLuong: Number(soLuong.toFixed(4)),
    chiPhiUocTinh: Number((soLuong * donGia).toFixed(4)),
  };
}

/**
 * @param {import('pg').Pool | import('pg').PoolClient} khachHang
 * @param {{
 *   workspaceId: string, jobId?: string | null, nhiemVu: string, moHinh: string,
 *   doDaiVao?: number, doDaiRa?: number, thoiGianChayMs?: number,
 *   thanhCong: boolean, loi?: string | null, contentId?: string | null,
 * }} ban
 * @returns {Promise<{ modelRunId: string, costLogId: string }>}
 */
async function ghiNhatKyChay(khachHang, ban) {
  const {
    workspaceId,
    jobId = null,
    nhiemVu,
    moHinh,
    doDaiVao = 0,
    doDaiRa = 0,
    thoiGianChayMs = 0,
    thanhCong,
    loi = null,
    contentId = null,
  } = ban;

  if (!workspaceId) throw new Error('ghiNhatKyChay: thieu workspaceId');

  const chay = await khachHang.query(
    `INSERT INTO model_runs
       (workspace_id, job_id, nhiem_vu, mo_hinh, do_dai_vao, do_dai_ra,
        thoi_gian_chay_ms, thanh_cong, loi, content_id)
     VALUES ($1, $2, $3::nhiem_vu_mo_hinh, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      workspaceId,
      jobId,
      nhiemVu,
      moHinh,
      Math.round(doDaiVao),
      Math.round(doDaiRa),
      Math.round(thoiGianChayMs),
      thanhCong,
      loi == null ? null : String(loi).slice(0, 4000),
      contentId,
    ],
  );
  const modelRunId = chay.rows[0].id;

  const { soLuong, chiPhiUocTinh } = tinhChiPhiUocTinh(doDaiVao, doDaiRa, moHinh);
  const so = await khachHang.query(
    `INSERT INTO cost_log
       (workspace_id, loai_chi_phi, so_luong, chi_phi_uoc_tinh, don_vi_tien,
        model_run_id, ghi_chu)
     VALUES ($1, 'goi-mo-hinh', $2, $3, 'VND', $4, $5)
     RETURNING id`,
    [
      workspaceId,
      soLuong,
      chiPhiUocTinh,
      modelRunId,
      `uoc tinh theo do dai (${moHinh}, ${thanhCong ? 'thanh cong' : 'that bai'})`,
    ],
  );

  return { modelRunId, costLogId: so.rows[0].id };
}

module.exports = { DON_GIA_VND_TREN_1K_KY_TU, ghiNhatKyChay, tinhChiPhiUocTinh };
