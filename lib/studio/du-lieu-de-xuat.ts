import type { BeMat } from './kieu';

export type ThamKhaoAnToan = {
  trendSignalId : string;
  kieuHook      : string | null;
  chuDe         : string[];
  soChu         : number;
  coCTA         : boolean;
};

export type SlotDeXuat = {
  khamPha  : boolean;
  thamKhao : ThamKhaoAnToan | null;
};

export type HoSoDeXuat = {
  giongDieu : string | null;
  dieuCamKy : string | null;
};

export type TruCotDeXuat = {
  ten         : string;
  tiLeMucTieu : number | null;
};

export type ChanDungDeXuat = {
  ten    : string;
  noiDau : string | null;
};

export type InsightDeXuat = { noiDung : string };

export type LichSuKenhMinhDeXuat = {
  gocTiepCan : string | null;
  cauMoDau   : string | null;
};

export type DuLieuNguonDeXuat = {
  hoSo           : HoSoDeXuat;
  truCot         : TruCotDeXuat[];
  chanDung       : ChanDungDeXuat[];
  insight        : InsightDeXuat[];
  lichSuKenhMinh : LichSuKenhMinhDeXuat[];
  beMat          : BeMat;
  soLuong        : number;
  slot           : SlotDeXuat[];
};

const BE_MAT_HOP_LE: BeMat[] = ['fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo'];

function chuoiSach(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function dungThamKhao(thamKhao: ThamKhaoAnToan | null): ThamKhaoAnToan | null {
  if (thamKhao === null) return null;
  const trendSignalId = chuoiSach(thamKhao.trendSignalId);
  if (trendSignalId === null) return null;

  return {
    trendSignalId,
    kieuHook : chuoiSach(thamKhao.kieuHook),
    chuDe    : Array.isArray(thamKhao.chuDe)
      ? thamKhao.chuDe.flatMap((chuDe) => {
        const sach = chuoiSach(chuDe);
        return sach === null ? [] : [sach];
      })
      : [],
    soChu : typeof thamKhao.soChu === 'number' && Number.isFinite(thamKhao.soChu)
      ? Math.max(0, Math.floor(thamKhao.soChu))
      : 0,
    coCTA : thamKhao.coCTA === true,
  };
}

function dungHoSo({ giongDieu, dieuCamKy }: HoSoDeXuat): HoSoDeXuat {
  return { giongDieu: chuoiSach(giongDieu), dieuCamKy: chuoiSach(dieuCamKy) };
}

function dungTruCot({ ten, tiLeMucTieu }: TruCotDeXuat): TruCotDeXuat {
  return {
    ten         : chuoiSach(ten) ?? '',
    tiLeMucTieu : typeof tiLeMucTieu === 'number' && Number.isFinite(tiLeMucTieu)
      ? tiLeMucTieu
      : null,
  };
}

function dungChanDung({ ten, noiDau }: ChanDungDeXuat): ChanDungDeXuat {
  return { ten: chuoiSach(ten) ?? '', noiDau: chuoiSach(noiDau) };
}

function dungInsight({ noiDung }: InsightDeXuat): InsightDeXuat {
  return { noiDung: chuoiSach(noiDung) ?? '' };
}

function dungLichSuKenhMinh({ gocTiepCan, cauMoDau }: LichSuKenhMinhDeXuat): LichSuKenhMinhDeXuat {
  return { gocTiepCan: chuoiSach(gocTiepCan), cauMoDau: chuoiSach(cauMoDau) };
}

function dungBeMat(beMat: BeMat): BeMat | null {
  return BE_MAT_HOP_LE.includes(beMat) ? beMat : null;
}

function dungSoLuong(soLuong: number): number {
  return Number.isFinite(soLuong) && Number.isInteger(soLuong) && soLuong >= 0 ? soLuong : 0;
}

export function dungDuLieuDeXuat(duLieu: DuLieuNguonDeXuat): unknown {
  // Dựng lại allowlist để dữ liệu thô từ bài ngoài không thể lọt vào lời nhắc.
  return {
    hoSo           : dungHoSo(duLieu.hoSo),
    truCot         : duLieu.truCot.map(dungTruCot),
    chanDung       : duLieu.chanDung.map(dungChanDung),
    insight        : duLieu.insight.map(dungInsight),
    lichSuKenhMinh : duLieu.lichSuKenhMinh.map(dungLichSuKenhMinh),
    beMat          : dungBeMat(duLieu.beMat),
    soLuong        : dungSoLuong(duLieu.soLuong),
    slot           : duLieu.slot.map(({ khamPha, thamKhao }) => ({
      khamPha  : khamPha === true,
      thamKhao : dungThamKhao(thamKhao),
    })),
  };
}
