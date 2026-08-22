'use strict';

/**
 * Vong lap lay viec cua worker-model.
 *
 * Bo chay duoc TIEM VAO (`chayViec`) chu khong `require` thang: nho vay bo test
 * do duoc gioi han dong thoi, tran thoi gian va so lan thu lai ma khong phai
 * dot mot luot goi mo hinh that cho moi lan chay test.
 *
 * Gioi han dong thoi la thu duy nhat giu VPS nay song: may chay chung ~50 du an
 * khac, moi container worker an toi 2GB RAM va 1.5 CPU. Bo gioi han la mot lan
 * nguoi dung bam 20 nut lam ca may lag.
 */

const { ghiNhanLoi, ghiNhanXong, layViec, thaKhoaViecTreo } = require('../../lib/queue/claim');

/** Phu luc B muc 6.2: worker-model chay 2-3 viec song song. */
const GIOI_HAN_DONG_THOI = 2;

/** Tran thoi gian cho mot viec goi mo hinh. */
const HET_GIO_VIEC_MS = 300_000;

/** Hang doi rong thi ngu bao lau truoc khi hoi lai. */
const NHIP_NGHI_MS = 2_000;

/**
 * @param {{
 *   be: import('pg').Pool,
 *   chayViec: (viec: object) => Promise<{ thanhCong: boolean, ketQua?: object|null, loi?: string|null }>,
 *   tenWorker: string,
 *   gioiHanDongThoi?: number,
 *   hetGioViecMs?: number,
 *   nhipNghiMs?: number,
 *   phutCoiLaTreo?: number,
 *   loaiViec?: string[] | null,
 *   workspaceId?: string | null,
 *   ghiNhatKy?: (thongDiep: string) => void,
 * }} caiDat
 */
function taoVongLap(caiDat) {
  const {
    be,
    chayViec,
    tenWorker,
    gioiHanDongThoi = GIOI_HAN_DONG_THOI,
    hetGioViecMs = HET_GIO_VIEC_MS,
    nhipNghiMs = NHIP_NGHI_MS,
    phutCoiLaTreo,
    loaiViec = null,
    // De trong o san xuat: mot worker phuc vu moi khong gian lam viec.
    workspaceId = null,
    ghiNhatKy = (thongDiep) => console.log(`[worker-model] ${thongDiep}`),
  } = caiDat;

  /** @type {Set<Promise<void>>} */
  const dangChay = new Set();
  let dangDung = false;

  /** So viec dang chay — bo test doc truc tiep de kiem gioi han dong thoi. */
  function soDangChay() {
    return dangChay.size;
  }

  /**
   * Mot vong: tha khoa viec treo roi lay viec cho day suat dong thoi.
   * @returns {Promise<number>} so viec vua nhan them
   */
  async function motVong() {
    const daTha = await thaKhoaViecTreo(be, { phutCoiLaTreo, workspaceId });
    if (daTha.length) ghiNhatKy(`tha khoa ${daTha.length} viec treo: ${daTha.join(', ')}`);

    let nhanThem = 0;
    while (!dangDung && dangChay.size < gioiHanDongThoi) {
      const viec = await layViec(be, { lockedBy: tenWorker, loaiViec, workspaceId });
      if (!viec) break;
      nhanThem += 1;
      theoDoi(viec);
    }
    return nhanThem;
  }

  function theoDoi(viec) {
    const chay = xuLyMotViec(viec).finally(() => {
      dangChay.delete(chay);
    });
    dangChay.add(chay);
  }

  async function xuLyMotViec(viec) {
    ghiNhatKy(`nhan viec ${viec.id} (${viec.loaiViec}, lan thu ${viec.soLanThu})`);
    try {
      const ban = await voiTranThoiGian(chayViec(viec), hetGioViecMs);
      if (ban && ban.thanhCong) {
        await ghiNhanXong(be, viec.id, ban.ketQua ?? {});
        ghiNhatKy(`viec ${viec.id} xong`);
        return;
      }
      const quyet = await ghiNhanLoi(be, {
        jobId: viec.id,
        soLanThu: viec.soLanThu,
        loi: (ban && ban.loi) || 'khong ro nguyen nhan',
      });
      ghiNhatKy(`viec ${viec.id} hong -> ${quyet.trangThai} (doi ${quyet.doiThemMs}ms)`);
    } catch (loi) {
      // Ke ca su co ngoai du kien cung phai ket so viec, khong thi viec ket o
      // `dang_chay` cho toi khi bo tha-khoa-treo don ho — cham 15 phut.
      const quyet = await ghiNhanLoi(be, {
        jobId: viec.id,
        soLanThu: viec.soLanThu,
        loi: loi && loi.message ? loi.message : String(loi),
      }).catch((e) => {
        ghiNhatKy(`KHONG ghi duoc loi cho viec ${viec.id}: ${e.message}`);
        return { trangThai: 'khong-ghi-duoc', doiThemMs: 0 };
      });
      ghiNhatKy(`viec ${viec.id} nem loi: ${loi && loi.message} -> ${quyet.trangThai}`);
    }
  }

  /**
   * Tran thoi gian o TANG VONG LAP. Bo chay that cung tu cat o trong container;
   * lop nay la luoi thu hai cho truong hop chinh `docker run` treo — khong co no
   * thi mot lan treo an mat mot suat dong thoi vinh vien.
   */
  function voiTranThoiGian(loiHua, hetGioMs) {
    let dongHo;
    const catNgang = new Promise((_, tuChoi) => {
      dongHo = setTimeout(
        () => tuChoi(new Error(`viec chay qua ${hetGioMs}ms, bi cat`)),
        hetGioMs,
      );
    });
    return Promise.race([loiHua, catNgang]).finally(() => clearTimeout(dongHo));
  }

  async function batDau() {
    dangDung = false;
    ghiNhatKy(`bat dau, gioi han dong thoi ${gioiHanDongThoi}, tran viec ${hetGioViecMs}ms`);
    while (!dangDung) {
      let nhanThem = 0;
      try {
        nhanThem = await motVong();
      } catch (loi) {
        // Mat ket noi CSDL khong duoc lam chet worker: pm2 khoi dong lai lien
        // tuc thi lai them tai cho may dang co van de.
        ghiNhatKy(`loi vong lap: ${loi && loi.message}`);
      }
      if (nhanThem === 0) await nghi(nhipNghiMs);
    }
    await Promise.allSettled([...dangChay]);
    ghiNhatKy('da dung');
  }

  async function dung() {
    dangDung = true;
    await Promise.allSettled([...dangChay]);
  }

  function nghi(ms) {
    return new Promise((tiep) => setTimeout(tiep, ms));
  }

  return { batDau, dung, motVong, soDangChay };
}

module.exports = {
  GIOI_HAN_DONG_THOI,
  HET_GIO_VIEC_MS,
  NHIP_NGHI_MS,
  taoVongLap,
};
