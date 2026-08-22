/**
 * Boc bai tu ho so Facebook CA NHAN CUA NGUOI KHAC.
 *
 * Dung lai nguyen bo boc da chay that cua luong keo bai cua minh
 * (`apify-ho-so-ca-nhan.ts`) — cung actor, cung ban tho, chi khac hinh dang tra
 * ve: bo phan `anh`, vi bai cua nguoi khac khong tai anh ve kho.
 *
 * MOT KHAC BIET VE CHI PHI so voi fanpage: actor nay nhan MOT URL ho so moi
 * luot (`maxProfilesPerRun: 1`), nen N ho so la N luot chay — khong gop duoc de
 * chia phi khoi dong nhu fanpage. Uoc tinh phai nhan theo so kenh.
 *
 * RANH GIOI DA GHI NHAN: chi ho so CONG KHAI. Ho so han che tra ve rong ma van
 * tinh tien luot chay; bang o man cai dat hien "keo ve 0 bai" de nguoi dung tu
 * tat. Khong tu tat — xem Phase 5 cua ke hoach.
 */

import { bocMotBai, GIA_MOI_LUOT_USD, NGUON_KEO } from './apify-ho-so-ca-nhan';
import type { BaiKenhNgoai, BoBoc } from './kieu-bai-kenh-ngoai';
import { chuoiAn } from './quet-cay-json';

export { ACTOR_HO_SO, NGUON_KEO } from './apify-ho-so-ca-nhan';

/** Do that 13/08/2026: 4 luot, moi luot $0,04995, khong phu thuoc so bai. */
export function uocTinhChiPhiHoSo(soKenh: number): number {
  return soKenh * GIA_MOI_LUOT_USD;
}

export function bocMotBaiHoSo(muc: Record<string, unknown>): BaiKenhNgoai | null {
  const bai = bocMotBai(muc);
  if (!bai) return null;

  return {
    maBai: bai.maBai,
    urlBai: bai.urlBai,
    noiDung: bai.noiDung,
    ngayDang: bai.ngayDang,
    // Bo boc goc khong phan loai dang bai; suy ra tu thu no da lay duoc.
    dangBai:
      bai.thoiLuongVideoMs !== null || bai.urlVideo.length > 0
        ? 'kich_ban_quay'
        : bai.anh.length > 0
          ? 'anh_chu'
          : 'chu',
    soThich: bai.soThich,
    soBinhLuan: bai.soBinhLuan,
    soChiaSe: bai.soChiaSe,
    thoiLuongVideoMs: bai.thoiLuongVideoMs,
    tho: bai.tho,
  };
}

/**
 * Actor nay khong tra truong `inputUrl`. Nhung mot luot chi chay MOT ho so nen
 * moi muc tat yeu thuoc ve kenh duy nhat cua luot do — nguoi goi biet kenh nao,
 * o day tra `null` de bo dieu phoi dung duong gan mot-kenh-mot-luot.
 */
export const bocHoSoCaNhan: BoBoc = {
  nguon: NGUON_KEO,
  bocMotMuc: bocMotBaiHoSo,
  urlKenhCuaMuc: (muc) => chuoiAn(muc.profile_url) || chuoiAn(muc.inputUrl) || null,
};

export function dauVaoHoSo(urlKenh: string, soBai: number) {
  return {
    profileUrls: [urlKenh],
    maxProfilesPerRun: 1,
    maxPostsPerProfile: soBai,
    expandAllPhotos: true,
    includeRawPayload: true,
  };
}
