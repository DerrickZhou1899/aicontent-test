export type BeMat = 'fanpage' | 'ho_so_ca_nhan' | 'tiktok' | 'zalo';

export type KetQuaStudio<T> =
  | { ok : true; duLieu : T; canhBao : string[] }
  | { ok : false; loi : string; canhBao : string[] };

export type YTuongDeXuat = {
  tieuDe     : string;
  truCot     : string | null;
  chanDung   : string | null;
  gocTiepCan : string | null;
  cauMoDau   : string | null;
  lyDoDeXuat : string | null;
  beMat      : BeMat;
  khamPha    : boolean;
};
