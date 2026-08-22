'use strict';

/**
 * Diem vao cua worker-model duoi pm2.
 *
 * Chay:  node -r dotenv/config workers/model/index.js
 *        (pm2 dung ecosystem.config.js, xem docs/runbook-hang-doi.md)
 *
 * Day la tien trinh DUY NHAT duoc goi CLI. Tien trinh web chi day viec vao bang
 * `jobs` — xem lib/model-runner/index.js.
 */

const os = require('node:os');

const { LOAI_VIEC_THEO_NHIEM_VU } = require('../../lib/model-runner/chon-mo-hinh');
const { ghiNhatKyChay } = require('../../lib/model-runner/ghi-nhat-ky');
const { thucThiNhiemVu } = require('../../lib/model-runner/thuc-thi-nhiem-vu');
const { beKetNoi, dongBeKetNoi } = require('../../db/client-worker');
const { taoVongLap, HET_GIO_VIEC_MS } = require('./vong-lap');

/** Chi nhan cac loai viec goi mo hinh; sinh anh / keo so lieu la worker khac. */
const LOAI_VIEC_NHAN = [...new Set(Object.values(LOAI_VIEC_THEO_NHIEM_VU))];

/**
 * Chay mot viec: goi mo hinh roi ghi `model_runs` + `cost_log`.
 *
 * Nhat ky ghi CA khi that bai va ghi trong mot giao dich rieng, KHONG chung
 * giao dich voi viec cap nhat `jobs`: viec that bai van ton thoi gian may va
 * quota thue bao, mat dong nhat ky do la mat dung phan can nhat de tra loi "mot
 * nguoi dung tieu bao nhieu mot thang" (PRD muc 12.3).
 */
function taoChayViec(be) {
  return async function chayViec(viec) {
    const duLieuVao = { ...(viec.duLieuVao || {}) };
    const nhiemVu = duLieuVao.nhiemVu;
    const moHinh = duLieuVao.moHinh || 'auto';
    const contentId = duLieuVao.contentId || null;
    delete duLieuVao.nhiemVu;
    delete duLieuVao.moHinh;

    if (!nhiemVu) {
      return { thanhCong: false, loi: 'du_lieu_vao thieu truong nhiemVu' };
    }

    const ban = await thucThiNhiemVu({
      nhiemVu,
      duLieuVao,
      moHinh,
      hetGioMs: Number(process.env.WORKER_HET_GIO_MS || HET_GIO_VIEC_MS),
    });

    await ghiNhatKyTrongGiaoDich(be, {
      workspaceId: viec.workspaceId,
      jobId: viec.id,
      nhiemVu,
      moHinh: ban.moHinh,
      doDaiVao: ban.doDaiVao,
      doDaiRa: ban.doDaiRa,
      thoiGianChayMs: ban.thoiGianChayMs,
      thanhCong: ban.thanhCong,
      loi: ban.loi,
      contentId,
    });

    return {
      thanhCong: ban.thanhCong,
      // Nhan mo hinh di kem ket qua: khong co nhan thi sau vai tram bai khong
      // tra loi duoc "mo hinh nao viet hay hon" (PRD muc 8.3).
      ketQua: ban.thanhCong ? { moHinh: ban.moHinh, ...ban.ketQua } : null,
      loi: ban.loi,
    };
  };
}

async function ghiNhatKyTrongGiaoDich(be, ban) {
  const khachHang = await be.connect();
  try {
    await khachHang.query('BEGIN');
    await ghiNhatKyChay(khachHang, ban);
    await khachHang.query('COMMIT');
  } catch (loi) {
    await khachHang.query('ROLLBACK').catch(() => {});
    // Khong nem tiep: viec da chay xong roi, mat dong nhat ky khong duoc lam
    // viec do bi danh la hong va chay lai (ton them mot luot goi mo hinh).
    console.error('[worker-model] KHONG ghi duoc model_runs/cost_log:', loi.message);
  } finally {
    khachHang.release();
  }
}

async function chinh() {
  const tenBien = process.env.DATABASE_URL_WORKER ? 'DATABASE_URL_WORKER' : 'DATABASE_URL';
  const be = beKetNoi(tenBien);
  const tenWorker = `${os.hostname()}:${process.pid}`;

  const vongLap = taoVongLap({
    be,
    chayViec: taoChayViec(be),
    tenWorker,
    gioiHanDongThoi: Number(process.env.WORKER_DONG_THOI || 2),
    hetGioViecMs: Number(process.env.WORKER_HET_GIO_MS || HET_GIO_VIEC_MS),
    loaiViec: LOAI_VIEC_NHAN,
  });

  // Dung tu te: viec dang chay duoc chay het roi moi thoat. Thoat ngay lam viec
  // ket o `dang_chay` toi 15 phut cho toi khi bo tha-khoa-treo don ho.
  let dangDong = false;
  for (const tinHieu of ['SIGINT', 'SIGTERM']) {
    process.on(tinHieu, () => {
      if (dangDong) return;
      dangDong = true;
      console.log(`[worker-model] nhan ${tinHieu}, cho viec dang chay ket thuc`);
      vongLap
        .dung()
        .then(dongBeKetNoi)
        .finally(() => process.exit(0));
    });
  }

  console.log(`[worker-model] ${tenWorker} dung ${tenBien}, nhan: ${LOAI_VIEC_NHAN.join(', ')}`);
  await vongLap.batDau();
}

if (require.main === module) {
  chinh().catch((loi) => {
    console.error('[worker-model] chet:', loi);
    process.exit(1);
  });
}

module.exports = { LOAI_VIEC_NHAN, taoChayViec };
