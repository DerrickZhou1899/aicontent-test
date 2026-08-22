'use strict';

/**
 * Lop truu tuong goi mo hinh — PRD muc 8.2.
 *
 * WEB APP CHI GOI DUY NHAT `chayNhiemVu()` VA `layKetQua()`. Web app khong duoc
 * biet ben duoi la dong lenh hay giao dien lap trinh chinh thuc: hai bo chay
 * hien tai dung the thue bao ca nhan, va khi doi sang khoa API thi cho duy nhat
 * phai sua la `thuc-thi-nhiem-vu.js`, khong phai man hinh nao ca.
 *
 * Ham nay KHONG goi CLI. No day viec vao bang `jobs` roi cho worker chay. Ba ly
 * do, deu la yeu cau cua PRD muc 8.4:
 *   - gioi han so viec chay dong thoi (tien trinh web khong dem duoc)
 *   - thu lai co gian cach khi hong
 *   - cach ly: CLI chay bang user rieng trong Docker, khong phai user cua web
 */

const { chonMoHinh, loaiViecCuaNhiemVu, NHIEM_VU_HOP_LE } = require('./chon-mo-hinh');
const { beKetNoi } = require('../../db/client-worker');
const { dayViec, sinhKhoaChongTrung } = require('../queue/enqueue');

/** Cho lau hon tran 5 phut cua mot lan chay de con tinh thoi gian xep hang. */
const HET_GIO_CHO_MS = 360_000;
const NHIP_HOI_MS = 1_000;

/**
 * @param {{
 *   nhiemVu: 'viet-bai' | 'viet-kich-ban' | 'de-xuat-y-tuong' | 'cham-chat-luong'
 *          | 'phan-loai-binh-luan' | 'boc-tach-ho-so' | 'cham-diem-lien-quan',
 *   duLieuVao: Record<string, unknown>,
 *   moHinh?: 'claude-cli' | 'codex-cli' | 'auto',
 *   khongGianLamViec: string,
 *   cho?: boolean,
 *   khoaChongTrung?: string | null,
 *   hetGioChoMs?: number,
 *   khachHang?: import('pg').Pool | import('pg').PoolClient,
 * }} thamSo
 * @returns {Promise<{
 *   jobId: string, trangThai: 'cho' | 'dang_chay' | 'xong' | 'loi' | 'huy',
 *   moi: boolean, moHinh: string, ketQua: object | null, loi: string | null,
 * }>}
 */
async function chayNhiemVu(thamSo) {
  const {
    nhiemVu,
    duLieuVao = {},
    moHinh = 'auto',
    khongGianLamViec,
    cho = true,
    khoaChongTrung,
    hetGioChoMs = HET_GIO_CHO_MS,
    khachHang = beKetNoi('DATABASE_URL'),
  } = thamSo;

  if (!NHIEM_VU_HOP_LE.includes(nhiemVu)) {
    throw new Error(`chayNhiemVu: nhiem vu khong hop le: ${nhiemVu}`);
  }
  if (!khongGianLamViec) throw new Error('chayNhiemVu: thieu khongGianLamViec');

  // Chot mo hinh NGAY LUC DAY VIEC chu khong de worker tu chon: nguoi dung bam
  // "viet lai bang mo hinh khac" phai ra mot viec khac, khong bi khoa chong
  // trung gop chung voi lan truoc.
  const nhanMoHinh = chonMoHinh(nhiemVu, moHinh);
  const duLieuDayDu = { ...duLieuVao, nhiemVu, moHinh: nhanMoHinh };

  const khoa =
    khoaChongTrung === undefined
      ? sinhKhoaChongTrung(khongGianLamViec, nhiemVu, duLieuDayDu)
      : khoaChongTrung;

  const { jobId, moi } = await dayViec(khachHang, {
    workspaceId: khongGianLamViec,
    loaiViec: loaiViecCuaNhiemVu(nhiemVu),
    duLieuVao: duLieuDayDu,
    khoaChongTrung: khoa,
  });

  if (!cho) {
    const ngay = await layKetQua(jobId, khachHang);
    return { jobId, moi, moHinh: nhanMoHinh, ...ngay };
  }

  const xong = await choViecXong(jobId, khachHang, hetGioChoMs);
  return { jobId, moi, moHinh: nhanMoHinh, ...xong };
}

/**
 * Doc trang thai mot viec. Man hinh dung ham nay de hoi lai khi day viec voi
 * `cho: false`.
 */
async function layKetQua(jobId, khachHang = beKetNoi('DATABASE_URL')) {
  const ketQua = await khachHang.query(
    'SELECT trang_thai, ket_qua, loi FROM jobs WHERE id = $1',
    [jobId],
  );
  if (ketQua.rowCount === 0) throw new Error(`layKetQua: khong co viec ${jobId}`);
  const hang = ketQua.rows[0];
  return {
    trangThai: hang.trang_thai,
    ketQua: hang.ket_qua ?? null,
    loi: hang.loi ?? null,
  };
}

/**
 * Hoi lai theo nhip thay vi LISTEN/NOTIFY: mot viec goi mo hinh chay hang chuc
 * giay den vai phut, hoi moi giay la khong dang ke, va LISTEN giu mot ket noi
 * rieng cho tung yeu cau web.
 */
async function choViecXong(jobId, khachHang, hetGioChoMs) {
  const hanChot = Date.now() + hetGioChoMs;
  for (;;) {
    const ngay = await layKetQua(jobId, khachHang);
    if (ngay.trangThai === 'xong' || ngay.trangThai === 'loi' || ngay.trangThai === 'huy') {
      return ngay;
    }
    if (Date.now() >= hanChot) {
      // Viec van con trong hang doi; nguoi goi hoi lai bang layKetQua(jobId).
      return { ...ngay, loi: ngay.loi ?? 'het gio cho ket qua' };
    }
    await new Promise((tiep) => setTimeout(tiep, NHIP_HOI_MS));
  }
}

module.exports = { HET_GIO_CHO_MS, chayNhiemVu, layKetQua };
