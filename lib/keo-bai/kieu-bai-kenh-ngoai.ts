/**
 * Hinh dang chung ma CA BA bo boc kenh ngoai phai do ve.
 *
 * KHAC `BaiKeoVe` cua luong keo bai cua minh o mot cho: KHONG CO `anh`. Bai cua
 * nguoi khac khong tai anh ve kho — khong can anh de boc cong thuc ke, va tai
 * anh cua nguoi khac ve may minh la chuyen khac han ve ban chat. Lien ket anh
 * van con nguyen trong `tho` neu sau nay can.
 */

export type BaiKenhNgoai = {
  maBai: string;
  urlBai: string | null;
  noiDung: string;
  ngayDang: Date | null;
  dangBai: 'chu' | 'anh_chu' | 'kich_ban_quay';
  /** `null` = KHONG DO DUOC, khac han 0 = do duoc va bang khong. */
  soThich: number | null;
  soBinhLuan: number | null;
  soChiaSe: number | null;
  thoiLuongVideoMs: number | null;
  /** Ban tho nguyen van — viet lai bo boc ma khong phai tra tien keo lai. */
  tho: unknown;
};

/** Bo boc cua mot nen tang: doi muc Apify tra ve thanh hinh dang chung. */
export type BoBoc = {
  /** Ghi vao `trend_signals.nguon` de biet bai nay tu actor nao. */
  nguon: string;
  bocMotMuc: (muc: Record<string, unknown>) => BaiKenhNgoai | null;
  /**
   * URL kenh ma muc nay thuoc ve — de mot luot gop nhieu kenh van gan dung tung
   * bai. `null` khi khong xac dinh duoc; muc do bi bo qua chu khong gan bua.
   */
  urlKenhCuaMuc: (muc: Record<string, unknown>) => string | null;
};
