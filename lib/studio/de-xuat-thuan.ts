import { createHash } from 'node:crypto';

import type { SlotDeXuat, ThamKhaoAnToan } from './du-lieu-de-xuat';
import type { BeMat, YTuongDeXuat } from './kieu';

export const TI_LE_KHAM_PHA = 0.2;

export type ThamSoDeXuat = {
  workspaceId : string;
  beMat       : BeMat;
  soLuong     : number;
};

export type TruCotMucTieu = {
  ten         : string;
  tiLeMucTieu : number | null;
};

export type YTuongCoNguon = YTuongDeXuat & {
  trendSignalId : string | null;
};

type YTuongTho = Record<string, unknown>;

function sach(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}

export function khoa(giaTri: string): string {
  return giaTri.trim().toLocaleLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function tenChuan(giaTri: unknown, tenThat: string[]): string | null {
  const nhap = sach(giaTri);
  return nhap === null ? null : tenThat.find((ten) => khoa(ten) === khoa(nhap)) ?? null;
}

export function donKetQuaDeXuat(
  tho             : unknown,
  tenTruCotThat   : string[],
  tenChanDungThat : string[],
  beMat           : BeMat,
): YTuongDeXuat[] {
  const yTuong = tho && typeof tho === 'object' && Array.isArray((tho as { yTuong?: unknown }).yTuong)
    ? (tho as { yTuong: unknown[] }).yTuong
    : [];

  return yTuong.flatMap((mucTho): YTuongDeXuat[] => {
    if (!mucTho || typeof mucTho !== 'object' || Array.isArray(mucTho)) return [];
    const muc    = mucTho as YTuongTho;
    const tieuDe = sach(muc.tieuDe);
    if (tieuDe === null) return [];

    return [{
      tieuDe,
      truCot     : tenChuan(muc.truCot, tenTruCotThat),
      chanDung   : tenChuan(muc.chanDung, tenChanDungThat),
      gocTiepCan : sach(muc.gocTiepCan),
      cauMoDau   : sach(muc.cauMoDau),
      lyDoDeXuat : sach(muc.lyDoDeXuat),
      beMat,
      khamPha : muc.khamPha === true,
    }];
  });
}

export function donYTuongTheoSlot(
  tho             : unknown,
  slot            : SlotDeXuat[],
  tenTruCotThat   : string[],
  tenChanDungThat : string[],
  beMat           : BeMat,
): YTuongCoNguon[] {
  const yTuong = tho && typeof tho === 'object' && Array.isArray((tho as { yTuong?: unknown }).yTuong)
    ? (tho as { yTuong: unknown[] }).yTuong
    : [];

  // Ghép theo vị trí thô để một mục lỗi không làm nguồn của các mục sau bị lệch.
  return yTuong.flatMap((mucTho, chiSo): YTuongCoNguon[] => {
    const mucSlot = slot[chiSo];
    const [yTuongDaDon] = mucSlot
      ? donKetQuaDeXuat({ yTuong: [mucTho] }, tenTruCotThat, tenChanDungThat, beMat)
      : [];
    return yTuongDaDon
      ? [{
        ...yTuongDaDon,
        khamPha       : mucSlot.khamPha,
        trendSignalId : mucSlot.thamKhao?.trendSignalId ?? null,
      }]
      : [];
  });
}

export function taoSlotDeXuat(soLuong: number, thamKhao: ThamKhaoAnToan[]): SlotDeXuat[] {
  const idDaDung      = new Set<string>();
  const thamKhaoRieng = thamKhao.filter((muc) => {
    if (idDaDung.has(muc.trendSignalId)) return false;
    idDaDung.add(muc.trendSignalId);
    return true;
  });
  const slot = Array.from(
    { length: Math.round(soLuong * TI_LE_KHAM_PHA) },
    (): SlotDeXuat => ({ khamPha: true, thamKhao: null }),
  );

  for (let chiSo = 0; slot.length < soLuong; chiSo += 1) {
    const muc = thamKhaoRieng[chiSo] ?? null;
    slot.push({
      khamPha  : false,
      thamKhao : muc === null ? null : { ...muc, chuDe: [...muc.chuDe] },
    });
  }
  return slot;
}

function giaTriJsonChuan(giaTri: unknown): unknown {
  if (Array.isArray(giaTri)) return giaTri.map(giaTriJsonChuan);
  if (!giaTri || typeof giaTri !== 'object') return giaTri;

  // Thứ tự key không mang nghĩa nên phải chuẩn hóa trước khi tạo khóa chống trùng.
  const ketQua: Record<string, unknown> = {};
  for (const tenKhoa of Object.keys(giaTri).sort()) {
    const muc = (giaTri as Record<string, unknown>)[tenKhoa];
    if (muc !== undefined) ketQua[tenKhoa] = giaTriJsonChuan(muc);
  }
  return ketQua;
}

export function khoaChongTrungDeXuat(
  workspaceId  : string,
  beMat        : BeMat,
  duLieuAnToan : unknown,
): string {
  const ma = createHash('sha256')
    .update(JSON.stringify(giaTriJsonChuan(duLieuAnToan)))
    .digest('hex');
  return `de-xuat-y-tuong:${workspaceId}:${beMat}:sha256:${ma}`;
}

export function raiTheoTruCot<T extends YTuongDeXuat>(
  yTuongTho : T[],
  mucTieu   : TruCotMucTieu[],
  soLuong   : number,
): T[] {
  const gioiHan = Number.isFinite(soLuong) ? Math.max(0, Math.floor(soLuong)) : 0;
  if (gioiHan === 0) return [];

  const duyNhat   = [...new Set(yTuongTho)];
  const mucCoTiLe = mucTieu
    .map((muc, thuTu) => ({ muc, thuTu }))
    .filter(({ muc }) => typeof muc.tiLeMucTieu === 'number'
      && Number.isFinite(muc.tiLeMucTieu)
      && muc.tiLeMucTieu > 0);
  const tongTiLe = mucCoTiLe.reduce(
    (tong, { muc }) => tong + (muc.tiLeMucTieu as number),
    0,
  );
  const phanBo = new Map<number, number>();

  if (tongTiLe > 0) {
    const thapPhan = mucCoTiLe.map(({ muc, thuTu }) => ({
      thuTu,
      thuc : gioiHan * (muc.tiLeMucTieu as number) / tongTiLe,
    }));
    let daPhan = 0;
    for (const muc of thapPhan) {
      const san = Math.floor(muc.thuc);
      phanBo.set(muc.thuTu, san);
      daPhan += san;
    }
    thapPhan.sort((a, b) => (b.thuc % 1) - (a.thuc % 1) || a.thuTu - b.thuTu)
      .slice(0, gioiHan - daPhan)
      .forEach(({ thuTu }) => phanBo.set(thuTu, (phanBo.get(thuTu) ?? 0) + 1));
  }

  const daChon = new Set<T>();
  const ketQua: T[] = [];
  for (const [thuTu, muc] of mucTieu.entries()) {
    let daLay = 0;
    for (const yTuong of duyNhat) {
      const duChiTieu = daLay >= (phanBo.get(thuTu) ?? 0);
      if (duChiTieu || ketQua.length >= gioiHan || daChon.has(yTuong)) continue;
      if (khoa(yTuong.truCot ?? '') !== khoa(muc.ten)) continue;
      ketQua.push(yTuong);
      daChon.add(yTuong);
      daLay += 1;
    }
  }
  for (const yTuong of duyNhat) {
    if (ketQua.length >= gioiHan) break;
    if (!daChon.has(yTuong)) {
      ketQua.push(yTuong);
      daChon.add(yTuong);
    }
  }
  return ketQua;
}
