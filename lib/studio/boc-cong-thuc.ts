/**
 * Boc CACH KE tu bai cua kenh ngoai.
 *
 * HAI TANG, co y:
 *   - Do duoc bang ma thi do bang ma, 0 dong: so chu, co loi keu goi hay khong.
 *   - Chi phan phai doc hieu moi goi mo hinh: kieu hook va chu de.
 *
 * BOC MOT LAN ROI THOI. Chi chon bai `cong_thuc IS NULL`, chiem bang khoa
 * (`FOR UPDATE SKIP LOCKED`) roi tha ngay: co HAI duong cung goi ham nay — nut
 * bam o man de xuat va viec chay theo lich. Mot cau `where cong_thuc is null`
 * tran thi ca hai cung chon dung mot bai truoc khi ben nao ghi xong, tra tien mo
 * hinh hai lan cho mot bai.
 *
 * BA TRANG THAI cua cot `cong_thuc`:
 *   NULL          chua boc
 *   {}            DANG boc (da chiem, chua co ket qua)
 *   { kieuHook… } da boc xong
 * Cho nao doc `cong_thuc` deu phai phan biet ba trang thai nay, dung chi kiem
 * `!== null` — xem `daBocXong()` duoi day.
 */

import { createRepo } from '@/lib/data-access';
import { chayNhiemVu } from '@/lib/model-runner';

/** Chi giu truong CO NOI DOC. Them truong khong ai doc la rac trong CSDL. */
export type CongThuc = {
  /** Mot trong `KIEU_HOOK` cua `lib/model-runner/loi-nhac-xu-huong.js`. */
  kieuHook: string | null;
  chuDe: string[];
  soChu: number;
  coCTA: boolean;
};

/** Dau hieu keu goi hanh dong — do bang ma, khong ton mot dong nao. */
const DAU_HIEU_CTA = [
  'inbox',
  'nhắn tin',
  'nhan tin',
  'liên hệ',
  'lien he',
  'đặt hàng',
  'dat hang',
  'com',
  'link',
  'đăng ký',
  'dang ky',
  'gọi ngay',
  'goi ngay',
  'để lại',
  'de lai',
];

/** Dem tu theo khoang trang. Du cho viec so sanh do dai giua cac bai. */
export function demTu(vanBan: string): number {
  const sach = vanBan.trim();
  return sach === '' ? 0 : sach.split(/\s+/).length;
}

export function coLoiKeuGoi(vanBan: string): boolean {
  const thuong = vanBan.toLowerCase();
  return DAU_HIEU_CTA.some((d) => thuong.includes(d));
}

/** Phan do duoc bang ma. Ham thuan — test bang chuoi tay, khong goi mo hinh. */
export function bocBangLuat(noiDung: string): Pick<CongThuc, 'soChu' | 'coCTA'> {
  return { soChu: demTu(noiDung), coCTA: coLoiKeuGoi(noiDung) };
}

type MucModel = { id?: unknown; diem?: unknown; kieuHook?: unknown; chuDe?: unknown };

/** Don ket qua mo hinh. Ham thuan, test duoc bang du lieu tay. */
export function donKetQuaBocCongThuc(
  tho: unknown,
): Map<string, { diem: number | null; kieuHook: string | null; chuDe: string[] }> {
  const ket = new Map<string, { diem: number | null; kieuHook: string | null; chuDe: string[] }>();
  const mang = (tho as { diemLienQuan?: unknown })?.diemLienQuan;
  if (!Array.isArray(mang)) return ket;

  for (const m of mang as MucModel[]) {
    if (!m || typeof m !== 'object' || typeof m.id !== 'string') continue;
    const diem = typeof m.diem === 'number' && Number.isFinite(m.diem)
      ? Math.max(0, Math.min(100, Math.round(m.diem)))
      : null;
    ket.set(m.id, {
      diem,
      kieuHook: typeof m.kieuHook === 'string' && m.kieuHook.trim() !== '' ? m.kieuHook : null,
      chuDe: Array.isArray(m.chuDe)
        ? m.chuDe.filter((c): c is string => typeof c === 'string' && c.trim() !== '').slice(0, 4)
        : [],
    });
  }
  return ket;
}

export type KetQuaBoc = { soDaBoc: number; canhBao: string[] };

/**
 * Cong thuc da boc XONG chua.
 *
 * `{}` nghia la dang boc do dang, chua co gi de hoc — coi no nhu da boc thi loi
 * nhac nhan mot khoi tham khao rong ma khong ai biet.
 */
export function daBocXong(congThuc: unknown): boolean {
  if (!congThuc || typeof congThuc !== 'object') return false;
  return 'kieuHook' in (congThuc as Record<string, unknown>);
}

/**
 * Boc cong thuc cho toi da `gioiHan` bai chua boc.
 *
 * Ba duong ra deu phai TRA LAI bai da chiem: mo hinh nem loi, mo hinh tra ve
 * khong xong, va mo hinh bo sot bai. Quen mot duong la bai do ket o trang thai
 * "dang boc" vinh vien.
 */
export async function bocCongThucChoBaiMoi(
  workspaceId: string,
  gioiHan = 20,
): Promise<KetQuaBoc> {
  const repo = createRepo(workspaceId);

  // Chiem bai roi THA KHOA NGAY. Giu giao dich suot luot goi mo hinh (tran 360
  // giay) la giu mot trong 10 cho cua be ket noi ngan ay lau — vai lan bam cung
  // luc la can be, keo sap moi truy van khac cua ca ung dung.
  const bai = await repo.tinHieuXuHuong.chiemBaiChuaBoc(gioiHan);
  if (bai.length === 0) return { soDaBoc: 0, canhBao: [] };

  const idDaChiem = bai.map((b) => b.id);

  let ketQua;
  try {
    ketQua = await chayNhiemVu({
      nhiemVu: 'cham-diem-lien-quan',
      duLieuVao: {
        bai: bai.map((b) => ({
          id: b.id,
          noiDung: (b.noiDung ?? '').slice(0, 2000),
          dangBai: b.dangBai,
          soThich: b.soThich,
        })),
      },
      moHinh: 'auto',
      khongGianLamViec: workspaceId,
    });
  } catch (loi) {
    // Khong tra lai thi bai do mang co "dang boc" vinh vien va khong bao gio
    // duoc boc nua — hong im lang, dung thu ca thiet ke nay tranh.
    await repo.tinHieuXuHuong.traLaiChuaBoc(idDaChiem);
    throw loi;
  }

  if (ketQua.trangThai !== 'xong' || !ketQua.ketQua) {
    await repo.tinHieuXuHuong.traLaiChuaBoc(idDaChiem);
    return { soDaBoc: 0, canhBao: [ketQua.loi ?? 'Bóc công thức không xong.'] };
  }

  const theoId = donKetQuaBocCongThuc(ketQua.ketQua);
  let soDaBoc = 0;
  const canhBao: string[] = [];
  const boSot: string[] = [];

  for (const b of bai) {
    const tuMoHinh = theoId.get(b.id);
    if (!tuMoHinh) {
      boSot.push(b.id);
      canhBao.push(`Mô hình bỏ sót bài ${b.id}`);
      continue;
    }
    const luat = bocBangLuat(b.noiDung ?? '');
    await repo.tinHieuXuHuong.ghiCongThuc(b.id, {
      kieuHook: tuMoHinh.kieuHook,
      chuDe: tuMoHinh.chuDe,
      ...luat,
    } satisfies CongThuc);
    if (tuMoHinh.diem !== null) {
      await repo.tinHieuXuHuong.ghiDiemLienQuan(b.id, tuMoHinh.diem);
    }
    soDaBoc += 1;
  }

  // Bai mo hinh bo sot phai duoc tra lai, khong thi lan sau khong ai boc nua.
  await repo.tinHieuXuHuong.traLaiChuaBoc(boSot);

  return { soDaBoc, canhBao };
}
