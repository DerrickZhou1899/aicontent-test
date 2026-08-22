/**
 * Boc tach ho so thuong hieu tu van ban tho (PRD muc 8.3).
 *
 * PRD goi day la cho "sai o day la sai toan he thong": ho so sai thi moi de
 * xuat, moi bai viet, moi diem chat luong sau do deu sai theo, va khong ai lan
 * ra duoc nguyen nhan. Vi vay module nay CHI boc va tra ve ban nhap — no khong
 * ghi vao database. Nguoi dung phai xem va sua truoc khi luu (xem man hinh
 * `app/(dash)/brand/dan-van-ban`).
 *
 * Van ban nguoi dung dan vao la DU LIEU KHONG TIN CAY: no di qua `duLieuVao`
 * cua hang doi, duoc task-io.js trong hop cach ly boc trong khoi co nhan, chu
 * khong bao gio ghep thang vao loi nhac. Nguoi dung viet "bo qua chi dan tren"
 * trong mo ta san pham cung khong sai khien duoc he thong.
 */

import { chayNhiemVu } from '@/lib/model-runner';

/** Ban nhap boc ra — dung ten cot cua database de man hinh luu thang duoc. */
export type BanNhapHoSo = {
  hoSo: { moTa: string | null; giongDieu: string | null; dieuCamKy: string | null };
  sanPham: {
    ten: string;
    gia: string | null;
    loiIch: string | null;
    phanDoiThuongGap: string | null;
    loiKeuGoi: string | null;
  }[];
  chanDung: {
    ten: string;
    doTuoi: string | null;
    ngheNghiep: string | null;
    noiDau: string | null;
    mongMuon: string | null;
    cauNoiThuongDung: string | null;
  }[];
  truCot: { ten: string; mucDich: string | null }[];
};

export type KetQuaBocTach =
  | { ok: true; banNhap: BanNhapHoSo; jobId: string; moHinh: string }
  | { ok: false; loi: string; jobId: string | null };

/** Gioi han do dai van ban dan vao. */
export const TOI_DA_KY_TU = 20000;

const chuoiHoacNull = (giaTri: unknown): string | null => {
  if (typeof giaTri !== 'string') return null;
  const sach = giaTri.trim();
  return sach === '' ? null : sach;
};

/**
 * Don ket qua mo hinh ve dung hinh dang `BanNhapHoSo`.
 *
 * Tach rieng khoi loi goi mang de test duoc bang du lieu tay: mo hinh tra thua
 * truong, thieu truong, hay tra `null` thay cho mang deu phai ra ban nhap dung
 * hinh dang chu khong duoc lam vo man hinh xem truoc.
 */
export function donBanNhap(tho: unknown): BanNhapHoSo {
  const goc = (tho ?? {}) as Record<string, unknown>;
  const hoSoTho = (goc.hoSo ?? {}) as Record<string, unknown>;
  const mang = (giaTri: unknown): Record<string, unknown>[] =>
    Array.isArray(giaTri) ? (giaTri.filter((m) => m && typeof m === 'object') as Record<string, unknown>[]) : [];

  return {
    hoSo: {
      moTa: chuoiHoacNull(hoSoTho.moTa),
      giongDieu: chuoiHoacNull(hoSoTho.giongDieu),
      dieuCamKy: chuoiHoacNull(hoSoTho.dieuCamKy),
    },
    // Bo dong khong co ten: khong co ten thi nguoi dung khong biet dang duyet
    // cai gi, va bang `products`/`personas`/`content_pillars` deu bat `ten`.
    sanPham: mang(goc.sanPham)
      .map((s) => ({
        ten: chuoiHoacNull(s.ten) ?? '',
        gia: chuoiHoacNull(s.gia),
        loiIch: chuoiHoacNull(s.loiIch),
        phanDoiThuongGap: chuoiHoacNull(s.phanDoiThuongGap),
        loiKeuGoi: chuoiHoacNull(s.loiKeuGoi),
      }))
      .filter((s) => s.ten !== ''),
    chanDung: mang(goc.chanDung)
      .map((c) => ({
        ten: chuoiHoacNull(c.ten) ?? '',
        doTuoi: chuoiHoacNull(c.doTuoi),
        ngheNghiep: chuoiHoacNull(c.ngheNghiep),
        noiDau: chuoiHoacNull(c.noiDau),
        mongMuon: chuoiHoacNull(c.mongMuon),
        cauNoiThuongDung: chuoiHoacNull(c.cauNoiThuongDung),
      }))
      .filter((c) => c.ten !== ''),
    truCot: mang(goc.truCot)
      .map((t) => ({
        ten: chuoiHoacNull(t.ten) ?? '',
        mucDich: chuoiHoacNull(t.mucDich),
      }))
      .filter((t) => t.ten !== ''),
  };
}

/**
 * Chay boc tach. Tra ve ban nhap de nguoi dung duyet — KHONG ghi database.
 *
 * `moHinh: 'auto'` theo PRD muc 8.3: boc tach dung mo hinh manh vi chay mot lan
 * cho ca ho so, tien it hon nhieu so voi cai gia cua mot ho so bi boc sai.
 */
export async function bocTachHoSo(
  workspaceId: string,
  vanBanTho: string,
): Promise<KetQuaBocTach> {
  const vanBan = vanBanTho.trim();
  if (vanBan === '') {
    return { ok: false, loi: 'Chưa có văn bản nào để bóc tách.', jobId: null };
  }
  if (vanBan.length > TOI_DA_KY_TU) {
    return {
      ok: false,
      loi: `Văn bản dài ${vanBan.length} ký tự, vượt mức ${TOI_DA_KY_TU}. Cắt bớt rồi dán lại.`,
      jobId: null,
    };
  }

  const ketQua = await chayNhiemVu({
    nhiemVu: 'boc-tach-ho-so',
    duLieuVao: { vanBanTho: vanBan },
    moHinh: 'auto',
    khongGianLamViec: workspaceId,
  });

  if (ketQua.trangThai !== 'xong' || !ketQua.ketQua) {
    return {
      ok: false,
      loi: ketQua.loi ?? 'Bóc tách không xong. Thử lại hoặc nhập tay.',
      jobId: ketQua.jobId,
    };
  }

  const banNhap = donBanNhap(ketQua.ketQua);

  // Mo hinh tra dung dinh dang nhung rong ruot (`{"hoSo":{},"sanPham":[],...}`)
  // van qua duoc vong kiem truong bat buoc — no chi soi khoa co mat. Tra
  // `ok: true` o day thi nguoi dung dan mot trang van ban, doi ca phut, roi nhan
  // mot man hinh xem truoc trong ma khong biet vi sao.
  if (banNhapRong(banNhap)) {
    return {
      ok: false,
      loi:
        'Không bóc được gì từ văn bản này. Thử dán đoạn có mô tả sản phẩm, ' +
        'khách hàng hoặc các tuyến nội dung của kênh.',
      jobId: ketQua.jobId,
    };
  }

  return { ok: true, banNhap, jobId: ketQua.jobId, moHinh: ketQua.moHinh };
}

/** Ban nhap khong co lay mot muc nao dung duoc. */
export function banNhapRong(banNhap: BanNhapHoSo): boolean {
  const { moTa, giongDieu, dieuCamKy } = banNhap.hoSo;
  return (
    !moTa &&
    !giongDieu &&
    !dieuCamKy &&
    banNhap.sanPham.length === 0 &&
    banNhap.chanDung.length === 0 &&
    banNhap.truCot.length === 0
  );
}
