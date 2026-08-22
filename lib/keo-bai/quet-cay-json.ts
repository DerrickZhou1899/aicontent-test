/**
 * Doc so lieu tu ban tho cua Apify.
 *
 * CHUYEN NGUYEN TU `apify-ho-so-ca-nhan.ts` — ba bai hoc duoi day do bang mot
 * luot chay that (13/08/2026) va dung cho CA BA actor dang dung, khong phai dac
 * thu cua mot actor:
 *
 *  1. `stats` cua actor co the `null` het. Moi con so nam trong ban tho, o mot
 *     do sau bat ky, nen phai quet ca cay thay vi doc mot duong dan co dinh.
 *  2. So lieu duoc goi theo HAI dang trong cung mot ban tho: khi la so tran, khi
 *     la `{ count: N }`. Bo boc dau tien chi nhan dang so tran nen no bo qua con
 *     so THAT va vo phai mot con so khac — bai 112 luot thich bi ghi thanh 85.
 *  3. `null` van nghia la khong do duoc, KHAC HAN 0 nghia la do duoc va bang 0.
 */

/** Tim moi gia tri cua mot khoa o bat ky do sau nao trong cay JSON. */
export function quetKhoa(nut: unknown, ten: string, ket: unknown[] = []): unknown[] {
  if (Array.isArray(nut)) {
    for (const con of nut) quetKhoa(con, ten, ket);
  } else if (nut && typeof nut === 'object') {
    for (const [khoa, giaTri] of Object.entries(nut as Record<string, unknown>)) {
      if (khoa === ten) ket.push(giaTri);
      else quetKhoa(giaTri, ten, ket);
    }
  }
  return ket;
}

/**
 * Doi mot gia tri dem duoc thanh so.
 *
 * Facebook goi so lieu theo HAI dang trong cung mot ban tho: khi thi so tran,
 * khi thi boc trong `{ count: N, is_empty: bool }`. Doc ca hai dang la bat buoc.
 */
export function laySo(giaTri: unknown): number | null {
  if (typeof giaTri === 'number' && Number.isFinite(giaTri)) return giaTri;
  if (giaTri && typeof giaTri === 'object') {
    const dem = (giaTri as { count?: unknown }).count;
    if (typeof dem === 'number' && Number.isFinite(dem)) return dem;
  }
  return null;
}

/** So lon nhat tim duoc cho mot trong cac ten khoa. `null` khi khong co so nao. */
export function soLonNhat(tho: unknown, ...tenKhoa: string[]): number | null {
  const so = tenKhoa
    .flatMap((ten) => quetKhoa(tho, ten))
    .map(laySo)
    .filter((v): v is number => v !== null);
  return so.length ? Math.max(...so) : null;
}

/**
 * So binh luan nam trong `comments.total_count`.
 *
 * Phai tim CO DINH HUONG chu khong quet moi `total_count`: khoa do con duoc dung
 * cho anh trong album, phan ung theo tung loai, va vai cho khac. Quet bua la lay
 * nham so cua thu khac ma van trong nhu mot con so hop le.
 */
export function soBinhLuanTu(tho: unknown): number | null {
  const so = quetKhoa(tho, 'comments')
    .map((c) => (c && typeof c === 'object' ? (c as { total_count?: unknown }).total_count : null))
    .map(laySo)
    .filter((v): v is number => v !== null);
  return so.length ? Math.max(...so) : null;
}

export function chuoiAn(giaTri: unknown): string {
  return typeof giaTri === 'string' ? giaTri : '';
}

export function ngayAn(giaTri: unknown): Date | null {
  if (typeof giaTri !== 'string') return null;
  const ngay = new Date(giaTri);
  return Number.isNaN(ngay.getTime()) ? null : ngay;
}

/**
 * Ban tho co the la chuoi JSON hoac da la doi tuong. Giu nguyen chuoi khi khong
 * doc duoc: ban tho khong doc duoc van hon la mat han.
 */
export function moBanTho(giaTri: unknown): unknown {
  if (typeof giaTri !== 'string') return giaTri ?? null;
  try {
    return JSON.parse(giaTri);
  } catch {
    return giaTri;
  }
}
