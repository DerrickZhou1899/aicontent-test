export type PhanCanhKichBan = {
  thoiLuongGiay : number;
  hinhAnh       : string;
  loiThoai      : string;
};

export type BanNhapKichBan = {
  tieuDe   : string;
  phanCanh : PhanCanhKichBan[];
};

type Dong = Record<string, unknown>;

function chuoiSach(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}

function donPhanCanh(tho: unknown): PhanCanhKichBan | null {
  if (!tho || typeof tho !== 'object' || Array.isArray(tho)) return null;
  const dong          = tho as Dong;
  const thoiLuongGiay = dong.thoiLuongGiay;
  const hinhAnh       = chuoiSach(dong.hinhAnh);
  const loiThoai      = typeof dong.loiThoai === 'string' ? dong.loiThoai.trim() : null;
  if (
    typeof thoiLuongGiay !== 'number'
    || !Number.isFinite(thoiLuongGiay)
    || thoiLuongGiay <= 0
    || hinhAnh === null
    || loiThoai === null
  ) return null;
  return { thoiLuongGiay, hinhAnh, loiThoai };
}

export function donKetQuaKichBan(tho: unknown): BanNhapKichBan | null {
  if (!tho || typeof tho !== 'object' || Array.isArray(tho)) return null;
  const dong     = tho as Dong;
  const tieuDe   = chuoiSach(dong.tieuDe);
  const phanCanh = Array.isArray(dong.phanCanh)
    ? dong.phanCanh.flatMap((muc) => {
      const sach = donPhanCanh(muc);
      return sach === null ? [] : [sach];
    })
    : [];
  return tieuDe && phanCanh.length > 0 ? { tieuDe, phanCanh } : null;
}
