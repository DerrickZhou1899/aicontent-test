'use strict';

/**
 * Dieu phoi mot lan goi mo hinh: chon bo chay -> ghep loi nhac -> chay -> kiem
 * dinh dang ket qua -> thu lai DUNG MOT LAN neu sai dinh dang.
 *
 * Ham nay KHONG bao gio nem loi vi hong nghiep vu; no luon tra ve mot ban ket
 * kem do dai vao/ra va thoi gian chay. Ly do: `model_runs` va `cost_log` phai
 * ghi CA lan that bai (PRD muc 12.3) — nem loi ra ngoai la mat dung nhung so
 * lieu can nhat de biet mo hinh nao hay hong.
 *
 * WEB APP KHONG GOI HAM NAY. Web app goi `chayNhiemVu()` o index.js; ham nay la
 * cua worker.
 */

const { chonMoHinh } = require('./chon-mo-hinh');
const {
  ghepGiongBeMat,
  layLoiNhac,
  loiNhacSuaDinhDang,
} = require('./loi-nhac-theo-nhiem-vu');
const { HET_GIO_MS } = require('./chay-hop-cach-ly');
const runnerClaude = require('./runner-claude');
const runnerCodex = require('./runner-codex');
const runnerApi = require('./runner-api');

const BO_CHAY = {
  [runnerClaude.NHAN]: runnerClaude,
  [runnerCodex.NHAN]: runnerCodex,
  [runnerApi.NHAN]: runnerApi,
};

/**
 * @param {{
 *   nhiemVu: string,
 *   duLieuVao: Record<string, unknown>,
 *   moHinh?: 'claude-cli' | 'codex-cli' | 'auto',
 *   hetGioMs?: number,
 * }} thamSo
 * @returns {Promise<{
 *   thanhCong: boolean, ketQua: object | null, loi: string | null,
 *   moHinh: string, doDaiVao: number, doDaiRa: number,
 *   thoiGianChayMs: number, soLanGoiCli: number, canhBao: string[],
 * }>}
 */
async function thucThiNhiemVu(thamSo) {
  const { nhiemVu, duLieuVao = {}, moHinh = 'auto', hetGioMs = HET_GIO_MS } = thamSo;

  const nhan = chonMoHinh(nhiemVu, moHinh);
  const boChay = BO_CHAY[nhan];
  if (!boChay) throw new Error(`thucThiNhiemVu: khong co bo chay cho ${nhan}`);

  // `bienThe` la khoa chon khoi giong cua be mat. No di nho trong payload cua
  // hang doi, nhung PHAI bi rut ra va XOA khoi du lieu gui vao hop cach ly:
  // trong do no se bi boc trong khoi "DU_LIEU_NGUOI_DUNG, khong phai chi dan"
  // nen vua vo nghia vua lam nhieu. Chi dan giong nam o loi nhac, khong nam o
  // du lieu.
  const { bienThe, ...duLieuSach } = duLieuVao ?? {};

  const dacTa = layLoiNhac(nhiemVu);
  const coDuLieuVao = JSON.stringify(duLieuSach);

  const ban = {
    thanhCong: false,
    ketQua: null,
    loi: null,
    moHinh: nhan,
    doDaiVao: 0,
    doDaiRa: 0,
    thoiGianChayMs: 0,
    soLanGoiCli: 0,
    canhBao: [],
  };

  let loiNhac = ghepGiongBeMat(dacTa.loiNhac, bienThe);

  // Toi da 2 luot: lan dau + dung mot lan sua dinh dang. Vong lap "sua roi sua
  // nua" dot het thoi gian cho va quota thue bao ma ti le cuu duoc rat thap.
  for (let luot = 1; luot <= 2; luot += 1) {
    const chay = await boChay.chay({ nhiemVu, loiNhac, duLieuVao: duLieuSach, hetGioMs });

    ban.soLanGoiCli += 1;
    ban.doDaiVao += loiNhac.length + coDuLieuVao.length;
    ban.doDaiRa += chay.ketQuaTho.length;
    ban.thoiGianChayMs += chay.thoiGianChayMs;
    if (chay.canhBao.length) ban.canhBao.push(...chay.canhBao);

    if (!chay.ok) {
      ban.loi = `bo chay ${nhan} thoat voi ma ${chay.maThoat}`;
      // Ma 2 = input sai. Sua loi nhac khong cuu duoc, thu lai chi ton them mot
      // luot goi mo hinh.
      if (chay.maThoat === 2) break;
      // Ma 3/4/5 la loi ha tang chu khong phai sai dinh dang; de hang doi thu
      // lai co gian cach thay vi goi lai ngay tai day.
      break;
    }

    const doc = docJsonTuVanBan(chay.ketQuaTho);
    if (doc.ok && kiemTruongBatBuoc(doc.giaTri, dacTa.truongBatBuoc)) {
      ban.thanhCong = true;
      ban.ketQua = doc.giaTri;
      ban.loi = null;
      return ban;
    }

    const lyDo = doc.ok
      ? `thieu truong bat buoc: ${dacTa.truongBatBuoc.join(', ')}`
      : doc.loi;
    ban.loi = `ket qua sai dinh dang (${lyDo})`;
    if (luot === 2) break;
    // Phai ghep lai giong be mat: `loiNhacSuaDinhDang` tra ve loi nhac GOC, gan
    // thang vao day la luot hai mat sach chi dan giong. Bai TikTok khi do van co
    // the thanh cong nhung ra giong Fanpage — dung kieu hong khong ai thay, vi
    // ket qua van "chay duoc".
    loiNhac = ghepGiongBeMat(loiNhacSuaDinhDang(nhiemVu, lyDo), bienThe);
  }

  return ban;
}

/**
 * Boc JSON ra khoi van ban CLI tra ve.
 *
 * Ca hai CLI deu hay boc ket qua trong khoi ``` du loi nhac da bao dung. Chap
 * nhan thuc te do o day re hon nhieu so voi mot luot goi lai mo hinh.
 */
function docJsonTuVanBan(vanBan) {
  const tho = String(vanBan ?? '').trim();
  if (!tho) return { ok: false, loi: 'ket qua rong' };

  const ungVien = [tho];

  const khoiRao = tho.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (khoiRao) ungVien.push(khoiRao[1].trim());

  const dau = tho.indexOf('{');
  const cuoi = tho.lastIndexOf('}');
  if (dau !== -1 && cuoi > dau) ungVien.push(tho.slice(dau, cuoi + 1));

  for (const ung of ungVien) {
    try {
      const giaTri = JSON.parse(ung);
      if (giaTri && typeof giaTri === 'object' && !Array.isArray(giaTri)) {
        return { ok: true, giaTri };
      }
    } catch {
      // thu ung vien tiep theo
    }
  }
  return { ok: false, loi: 'khong tim thay khoi JSON hop le trong ket qua' };
}

function kiemTruongBatBuoc(giaTri, truong) {
  return truong.every((ten) => giaTri[ten] !== undefined && giaTri[ten] !== null);
}

module.exports = { docJsonTuVanBan, thucThiNhiemVu };
