/**
 * Bóc CÁCH KỂ từ bài của kênh ngoài.
 *
 * HAI TẦNG, có ý:
 *   - Đo được bằng mã thì đo bằng mã, 0 đồng: số chữ, có lời kêu gọi hay không.
 *   - Chỉ phần phải đọc hiểu mới gọi mô hình: kiểu hook và chủ đề.
 *
 * BÓC MỘT LẦN RỒI THÔI. Chỉ chọn bài `cong_thuc IS NULL`, chiếm bằng khóa
 * (`FOR UPDATE SKIP LOCKED`) rồi thả ngay: có HAI đường cùng gọi hàm này — nút
 * bấm ở màn đề xuất và việc chạy theo lịch. Một câu `where cong_thuc is null`
 * trần thì cả hai cùng chọn đúng một bài trước khi bên nào ghi xong, trả tiền mô
 * hình hai lần cho một bài.
 *
 * BA TRẠNG THÁI của cột `cong_thuc`:
 *   NULL          chưa bóc
 *   {}            ĐANG bóc (đã chiếm, chưa có kết quả)
 *   { kieuHook… } đã bóc xong
 * Chỗ nào đọc `cong_thuc` đều phải phân biệt ba trạng thái này, đừng chỉ kiểm
 * `!== null` — xem `daBocXong()` dưới đây.
 */

import { createRepo } from '@/lib/data-access';
import { chayNhiemVu } from '@/lib/model-runner';

/** Chỉ giữ trường CÓ NƠI ĐỌC. Thêm trường không ai đọc là rác trong CSDL. */
export type CongThuc = {
  /** Một trong `KIEU_HOOK` của `lib/model-runner/loi-nhac-xu-huong.js`. */
  kieuHook : string | null;
  chuDe    : string[];
  soChu    : number;
  coCTA    : boolean;
};

/** Dấu hiệu kêu gọi hành động — đo bằng mã, không tốn một đồng nào. */
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

/** Đếm từ theo khoảng trắng. Đủ cho việc so sánh độ dài giữa các bài. */
export function demTu(vanBan: string): number {
  const sach = vanBan.trim();
  return sach === '' ? 0 : sach.split(/\s+/).length;
}

export function coLoiKeuGoi(vanBan: string): boolean {
  const thuong = vanBan.toLowerCase();
  return DAU_HIEU_CTA.some((d) => thuong.includes(d));
}

/** Phần đo được bằng mã. Hàm thuần — test bằng chuỗi tay, không gọi mô hình. */
export function bocBangLuat(noiDung: string): Pick<CongThuc, 'soChu' | 'coCTA'> {
  return { soChu: demTu(noiDung), coCTA: coLoiKeuGoi(noiDung) };
}

type MucModel = { id?: unknown; diem?: unknown; kieuHook?: unknown; chuDe?: unknown };

/** Dọn kết quả mô hình. Hàm thuần, test được bằng dữ liệu tay. */
export function donKetQuaBocCongThuc(
  tho : unknown,
): Map<string, { diem: number | null; kieuHook: string | null; chuDe: string[] }> {
  const ket  = new Map<string, { diem: number | null; kieuHook: string | null; chuDe: string[] }>();
  const mang = (tho as { diemLienQuan?: unknown })?.diemLienQuan;
  if (!Array.isArray(mang)) return ket;

  for (const m of mang as MucModel[]) {
    if (!m || typeof m !== 'object' || typeof m.id !== 'string') continue;
    const diem = typeof m.diem === 'number' && Number.isFinite(m.diem)
      ? Math.max(0, Math.min(100, Math.round(m.diem)))
      : null;
    ket.set(m.id, {
      diem,
      kieuHook : typeof m.kieuHook === 'string' && m.kieuHook.trim() !== '' ? m.kieuHook : null,
      chuDe    : Array.isArray(m.chuDe)
        ? m.chuDe.filter((c): c is string => typeof c === 'string' && c.trim() !== '').slice(0, 4)
        : [],
    });
  }
  return ket;
}

export type KetQuaBoc = { soDaBoc: number; canhBao: string[] };

/**
 * Công thức đã bóc XONG chưa.
 *
 * `{}` nghĩa là đang bóc dở dang, chưa có gì để học — coi nó như đã bóc thì lời
 * nhắc nhận một khối tham khảo rỗng mà không ai biết.
 */
export function daBocXong(congThuc: unknown): boolean {
  if (!congThuc || typeof congThuc !== 'object') return false;
  return 'kieuHook' in (congThuc as Record<string, unknown>);
}

/**
 * Bóc công thức cho tối đa `gioiHan` bài chưa bóc.
 *
 * Ba đường ra đều phải TRẢ LẠI bài đã chiếm: mô hình ném lỗi, mô hình trả về
 * không xong, và mô hình bỏ sót bài. Quên một đường là bài đó kẹt ở trạng thái
 * "đang bóc" vĩnh viễn.
 */
export async function bocCongThucChoBaiMoi(
  workspaceId : string,
  gioiHan = 20,
): Promise<KetQuaBoc> {
  const repo = createRepo(workspaceId);

  // Chiếm bài rồi THẢ KHÓA NGAY. Giữ giao dịch suốt lượt gọi mô hình (trần 360
  // giây) là giữ một trong 10 chỗ của bể kết nối ngần ấy lâu — vài lần bấm cùng
  // lúc là cạn bể, kéo sập mọi truy vấn khác của cả ứng dụng.
  const bai = await repo.tinHieuXuHuong.chiemBaiChuaBoc(gioiHan);
  if (bai.length === 0) return { soDaBoc: 0, canhBao: [] };

  const idDaChiem = bai.map((b) => b.id);

  let ketQua;
  try {
    ketQua = await chayNhiemVu({
      nhiemVu   : 'cham-diem-lien-quan',
      duLieuVao : {
        bai : bai.map((b) => ({
          id      : b.id,
          noiDung : (b.noiDung ?? '').slice(0, 2000),
          dangBai : b.dangBai,
          soThich : b.soThich,
        })),
      },
      moHinh           : 'auto',
      khongGianLamViec : workspaceId,
    });
  } catch (loi) {
    // Không trả lại thì bài đó mang cờ "đang bóc" vĩnh viễn và không bao giờ
    // được bóc nữa — hỏng im lặng, đúng thứ cả thiết kế này tránh.
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
      kieuHook : tuMoHinh.kieuHook,
      chuDe    : tuMoHinh.chuDe,
      ...luat,
    } satisfies CongThuc);
    if (tuMoHinh.diem !== null) {
      await repo.tinHieuXuHuong.ghiDiemLienQuan(b.id, tuMoHinh.diem);
    }
    soDaBoc += 1;
  }

  // Bài mô hình bỏ sót phải được trả lại, không thì lần sau không ai bóc nữa.
  await repo.tinHieuXuHuong.traLaiChuaBoc(boSot);

  return { soDaBoc, canhBao };
}
