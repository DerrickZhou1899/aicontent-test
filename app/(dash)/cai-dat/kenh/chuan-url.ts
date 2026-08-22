/**
 * Chuan hoa lien ket kenh truoc khi gui cho Apify.
 *
 * TEP RIENG chu khong nam trong `actions.ts`: tep do co `'use server'` nen chi
 * duoc xuat ham async. Day la ham thuan, va cung nho the ma test duoc truc tiep.
 *
 * VI SAO KIEM O MAY CHU chu khong tin man hinh: chuoi nguoi dung go se duoc gui
 * THANG cho Apify, va Apify tinh tien theo luot chay KE CA luot chay voi dau
 * vao vo nghia.
 */

/** Chi nhan lien ket Facebook that. */
export function chuanUrlFacebook(tho: string): string | null {
  const sach = tho.trim();
  if (sach === '') return null;
  let url: URL;
  try {
    url = new URL(sach);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const may = url.hostname.toLowerCase().replace(/^www\./, '');
  if (may !== 'facebook.com' && may !== 'm.facebook.com' && may !== 'web.facebook.com') {
    return null;
  }
  if (url.pathname === '/' || url.pathname === '') return null;
  // Bo tham so theo doi — chung khong thuoc ve dinh danh cua kenh.
  return `https://www.facebook.com${url.pathname.replace(/\/+$/, '')}`;
}

/** Chi nhan lien ket TikTok that, dang `https://www.tiktok.com/@ten`. */
export function chuanUrlTikTok(tho: string): string | null {
  const sach = tho.trim();
  if (sach === '') return null;
  let url: URL;
  try {
    url = new URL(sach);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const may = url.hostname.toLowerCase().replace(/^www\./, '');
  if (may !== 'tiktok.com' && may !== 'm.tiktok.com' && may !== 'vt.tiktok.com') return null;
  const duongDan = url.pathname.replace(/\/+$/, '');
  if (!duongDan.startsWith('/@') || duongDan.length < 3) return null;
  return `https://www.tiktok.com${duongDan}`;
}

/** Be mat nao thi dung bo chuan hoa nao. `zalo` chua co bo keo nen khong nhan. */
export function chuanUrlTheoBeMat(beMat: string, tho: string): string | null {
  if (beMat === 'tiktok') return chuanUrlTikTok(tho);
  if (beMat === 'fanpage' || beMat === 'ho_so_ca_nhan') return chuanUrlFacebook(tho);
  return null;
}
