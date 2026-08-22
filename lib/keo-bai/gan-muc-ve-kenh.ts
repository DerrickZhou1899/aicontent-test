/**
 * Gan moi muc Apify tra ve vao dung kenh cua no.
 *
 * MOT LUOT GOP NHIEU KENH nen ban tho tron lan; gan sai thi bai cua kenh A chui
 * vao kenh B va nguoi dung khong bao gio phat hien duoc bang mat thuong.
 *
 * Ham thuan, tach rieng de test duoc bang du lieu tay.
 */

import type { KenhTheoDoi } from '@/lib/data-access/kenh-theo-doi';

import type { BoBoc } from './kieu-bai-kenh-ngoai';

/** Duong dan cua URL, dung lam khoa so khop. `null` khi URL khong doc duoc. */
export function duongDanKenh(url: string): string | null {
  try {
    const duongDan = new URL(url).pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    return duongDan === '' ? null : duongDan;
  } catch {
    return null;
  }
}

export type KetQuaGan = {
  /** `kenh.id` -> cac muc thuoc ve no. */
  theoKenh: Map<string, Record<string, unknown>[]>;
  /** Muc khong xac dinh duoc kenh — BO QUA chu khong gan bua vao kenh dau tien. */
  soKhongGan: number;
};

export function ganMucVeKenh(
  muc: Record<string, unknown>[],
  kenh: KenhTheoDoi[],
  boBoc: BoBoc,
): KetQuaGan {
  const theoDuongDan = new Map<string, KenhTheoDoi>();
  for (const k of kenh) {
    const duongDan = duongDanKenh(k.urlKenh);
    if (duongDan) theoDuongDan.set(duongDan, k);
  }

  const theoKenh = new Map<string, Record<string, unknown>[]>();
  let soKhongGan = 0;

  for (const m of muc) {
    // Luot chi co MOT kenh thi moi muc tat yeu thuoc ve no — khong can actor tra
    // truong nao. Actor ho so ca nhan khong tra `inputUrl` va chi chay mot ho so
    // moi luot, nen day la duong duy nhat gan duoc bai cua no.
    let cua: KenhTheoDoi | undefined = kenh.length === 1 ? kenh[0] : undefined;
    if (!cua) {
      const url = boBoc.urlKenhCuaMuc(m);
      const duongDan = url ? duongDanKenh(url) : null;
      cua = duongDan ? theoDuongDan.get(duongDan) : undefined;
    }
    if (!cua) {
      soKhongGan += 1;
      continue;
    }
    const da = theoKenh.get(cua.id) ?? [];
    da.push(m);
    theoKenh.set(cua.id, da);
  }

  return { theoKenh, soKhongGan };
}
