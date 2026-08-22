/**
 * Ham thuan: dinh dang o va so khop bo loc cho bang kenh ngoai.
 *
 * Tach khoi `bang-kenh-ngoai.tsx` de tep do ve duoi 200 dong (quy uoc du an).
 * Ranh gioi tach dung nghia: o day khong co trang thai, khong co JSX — vao gi
 * ra nay, thu duy nhat co the kiem bang mat.
 *
 * CO Y chep tu man "Bai da dang" chu khong dung chung: hai bang co the tien hoa
 * khac huong (bang kia con cot anh/video/phu de). Den noi thu ba moi tach chung.
 */

/**
 * Tran so bai mot lan tai. Dat o day vi CA trang (truy van) va bang (dong chu
 * bao cham tran) deu can — tep nay khong phai `'use client'` nen may chu import
 * duoc, khac `bang-kenh-ngoai.tsx`.
 */
export const TRAN_BAI = 200;

export function ngayViet(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function giay(ms: number | null): string {
  if (ms === null) return '—';
  const t = Math.round(ms / 1000);
  return t >= 60 ? `${Math.floor(t / 60)}p${String(t % 60).padStart(2, '0')}` : `${t}s`;
}

/** `null` hien dau gach, khong hien 0 — khong do duoc khac han do duoc va bang 0. */
export function so(v: number | null): string {
  return v === null ? '—' : String(v);
}

/**
 * Ten dang bai cho nguoi doc.
 *
 * BA gia tri chu khong phai hai: enum `dang_bai` co ca `anh_chu`, va bo boc
 * kenh ngoai sinh ra no that (`boc-fanpage.ts`, `boc-ho-so-ca-nhan.ts`). Man
 * "Bai da dang" chia hai la dung voi rieng no — bo boc kenh MINH chi ghi `chu`
 * hoac `kich_ban_quay`. Chep nguyen the nhi phan sang day thi bai anh + caption
 * cua fanpage hien ra "Chu" va loc "anh" khong bao gio thay.
 */
export function tenDang(dangBai: string | null): string {
  if (dangBai === 'kich_ban_quay') return 'Video';
  if (dangBai === 'anh_chu') return 'Ảnh';
  if (dangBai === 'chu') return 'Chữ';
  return '—';
}

/**
 * So khop mot o loc voi mot con so.
 *
 * Chap nhan ba dang: `12` (bang), `>12` / `<12` (so sanh). Nguoi dung go so
 * tran la truong hop hay gap nhat nen no phai la mac dinh, khong bat hoc cu phap.
 *
 * Gia tri `null` (khong do duoc) KHONG khop bat ky o loc so nao — loc "thich
 * > 0" ma tra ve ca bai khong do duoc thi con so tren bang thanh vo nghia.
 */
export function khopSo(loc: string, giaTri: number | null): boolean {
  const sach = loc.trim();
  if (sach === '') return true;
  if (giaTri === null) return false;

  const dau = sach[0];
  if (dau === '>' || dau === '<') {
    const nguong = Number(sach.slice(1).trim());
    if (Number.isNaN(nguong)) return true;
    return dau === '>' ? giaTri > nguong : giaTri < nguong;
  }
  const n = Number(sach);
  return Number.isNaN(n) ? true : giaTri === n;
}

export function khopChu(loc: string, giaTri: string): boolean {
  const sach = loc.trim().toLowerCase();
  return sach === '' || giaTri.toLowerCase().includes(sach);
}
