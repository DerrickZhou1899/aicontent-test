/**
 * Kho anh tren dia.
 *
 * VI SAO TAI ANH VE ma khong tai video: lien ket CDN cua Facebook het han sau
 * vai ngay — giu lien ket la vai hom sau mo lai thay anh trang, va lay lai chi
 * co cach keo lai (ton tien Apify). Tai anh la viec doc-ghi thuan, khong ton CPU
 * nhu bo ma hoa video, nen no khong dung vao rang buoc "khong lam nang VPS".
 *
 * KHO NAM NGOAI THU MUC MA NGUON. Dat trong `public/` la moi lan trien khai lai
 * build de len; dat trong thu muc lam viec la `auto-deploy.sh` khong fast-forward
 * duoc nua. Duong dan goc doc tu `KHO_MEDIA`.
 */

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Tran mot tep anh. Anh Facebook thuong duoi 1MB; qua 8MB gan nhu chac la nham tep. */
const TRAN_BYTE = 8 * 1024 * 1024;

const DUOI_HOP_LE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function goc(): string {
  // Mac dinh nam NGOAI thu muc ma nguon co chu y: de trong `public/` thi moi lan
  // build de mat, de trong thu muc lam viec thi lot vao git.
  return process.env.KHO_MEDIA || path.join(process.cwd(), '..', 'aicontent-media');
}

/**
 * Duong dan tuong doi cua mot anh, luu vao `assets.duong_dan`.
 *
 * Bat dau bang `workspaceId` de mot yeu cau doc tep chi can so khop tien to la
 * biet no co quyen hay khong — khong phai tra cuu database moi lan tai anh.
 */
export function duongDanTuongDoi(workspaceId: string, url: string, duoi: string): string {
  const bam = createHash('sha256').update(url).digest('hex').slice(0, 32);
  return path.join(workspaceId, `${bam}.${duoi}`);
}

export type KetQuaTaiAnh =
  | { ok: true; duongDan: string; soByte: number }
  | { ok: false; loi: string };

/** May chu CDN chung cua Facebook, di toi duoc tu moi noi. */
const MAY_CHUNG = 'scontent.xx.fbcdn.net';

/**
 * Danh sach dia chi de thu, theo thu tu.
 *
 * VI SAO CAN: Facebook tra ve anh tren nhieu nut CDN, trong do co cac nut
 * `*.fna.fbcdn.net` dat BEN TRONG mang cua tung nha mang. Nut do chi di toi duoc
 * tu chinh mang ay — tu trung tam du lieu thi ket noi treo den het gio.
 *
 * Do that 13/08/2026 tren production: 14/22 anh hong, TAT CA deu tro ve
 * `scontent.frst1-1.fna.fbcdn.net`, con anh tren cac nut `.xx.` thi tai binh
 * thuong. Doi ten may sang nut chung giu nguyen chu ky va tai duoc ngay —
 * chu ky nam trong tham so URL, khong buoc vao ten may.
 */
function cacDiaChiThu(url: string): string[] {
  try {
    const goc = new URL(url);
    if (!goc.hostname.endsWith('.fbcdn.net') || goc.hostname === MAY_CHUNG) return [url];
    const thay = new URL(url);
    thay.hostname = MAY_CHUNG;
    return [url, thay.toString()];
  } catch {
    return [url];
  }
}

/**
 * Tai mot anh ve kho. Khong nem loi: mot anh hong khong duoc lam hong ca luot keo.
 */
export async function taiAnh(workspaceId: string, url: string): Promise<KetQuaTaiAnh> {
  let phanHoi: Response | null = null;
  let loiCuoi = 'không rõ lý do';

  for (const diaChi of cacDiaChiThu(url)) {
    try {
      const thu = await fetch(diaChi, { signal: AbortSignal.timeout(30_000) });
      if (thu.ok) {
        phanHoi = thu;
        break;
      }
      loiCuoi = `máy chủ ảnh trả về ${thu.status}`;
    } catch (loi) {
      const nguyenNhan = (loi as { cause?: { code?: string } }).cause?.code;
      loiCuoi = `không tải được: ${nguyenNhan ?? (loi as Error).message}`;
    }
  }

  if (!phanHoi) return { ok: false, loi: loiCuoi };

  const kieu = (phanHoi.headers.get('content-type') || '').split(';')[0].trim();
  const duoi = DUOI_HOP_LE[kieu];
  if (!duoi) return { ok: false, loi: `không phải ảnh (${kieu || 'không rõ kiểu'})` };

  const du = Buffer.from(await phanHoi.arrayBuffer());
  if (du.byteLength > TRAN_BYTE) return { ok: false, loi: 'ảnh vượt 8MB, bỏ qua' };

  const tuongDoi = duongDanTuongDoi(workspaceId, url, duoi);
  const dayDu = path.join(goc(), tuongDoi);
  await mkdir(path.dirname(dayDu), { recursive: true });
  await writeFile(dayDu, du);

  return { ok: true, duongDan: tuongDoi, soByte: du.byteLength };
}

/**
 * Doi duong dan tuong doi thanh duong dan tuyet doi, CHAN duong vuot thu muc.
 *
 * Duong `../` trong duong dan la doc duoc bat ky tep nao tren may chu qua tuyen
 * tai anh. Kiem o day chu khong o tuyen: moi cho doc kho deu phai di qua ham nay.
 */
export function duongDanAnToan(tuongDoi: string): string | null {
  const chuan = path.normalize(tuongDoi);
  if (chuan.startsWith('..') || path.isAbsolute(chuan)) return null;
  const dayDu = path.join(goc(), chuan);
  return dayDu.startsWith(path.join(goc(), path.sep)) ? dayDu : null;
}
