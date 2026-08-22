/**
 * Boc bai tu Facebook Fanpage — actor `apify/facebook-posts-scraper`.
 *
 * Gia do ngay 13/08/2026 o bac FREE (`GET /v2/store`): PAY_PER_EVENT,
 * `$0,005/bai` + `$0,001/luot khoi dong`. Actor nhan URL TRANG lam dau vao roi
 * tu tim bai, nen luu URL trang tinh trong `kenh_theo_doi` chu khong luu URL
 * tung bai — va nhieu trang gui duoc trong MOT luot, chi tra phi khoi dong mot lan.
 *
 * Ten truong khac hang ho so ca nhan (`postId` vs `source_post_id`, `text` vs
 * `raw_text`...), nhung ca hai deu nhet so lieu o do sau bat ky nen dung chung
 * bo quet cay.
 */

import type { BaiKenhNgoai, BoBoc } from './kieu-bai-kenh-ngoai';
import { chuoiAn, moBanTho, ngayAn, soBinhLuanTu, soLonNhat } from './quet-cay-json';

export const ACTOR_FANPAGE = 'apify~facebook-posts-scraper';
export const NGUON_FANPAGE = 'apify:apify/facebook-posts-scraper';

/**
 * Don gia.
 *
 * Bang gia `GET /v2/store` bac FREE ghi $0,005/bai. Luot chay THAT ngay
 * 13/08/2026 (run `mkaQtdcNacxlD407k`, 2 trang x 10 bai) het $0,066 — tuc
 * ~$0,0033/bai, RE HON bang gia. Dung so do duoc de uoc tinh khong lech, va de
 * canh bao lech 30% o Phase 6 chi keu khi co chuyen that.
 */
export const GIA_MOI_BAI_USD = 0.0033;
export const GIA_KHOI_DONG_USD = 0.001;

/**
 * `resultsLimit` la so bai MOI TRANG, khong phai tong — do bang luot chay that:
 * 2 trang, `resultsLimit: 10`, tra ve dung 20 muc.
 */
export function uocTinhChiPhiFanpage(soKenh: number, soBaiMoiKenh: number): number {
  return soKenh * soBaiMoiKenh * GIA_MOI_BAI_USD + GIA_KHOI_DONG_USD;
}

/** Chi ba dang bai ton tai trong luoc do; fanpage khong co video doc lap voi bai. */
function doanDangBai(muc: Record<string, unknown>, thoiLuongMs: number | null): BaiKenhNgoai['dangBai'] {
  if (muc.isVideo === true || thoiLuongMs !== null) return 'kich_ban_quay';
  const coAnh =
    (Array.isArray(muc.media) && muc.media.length > 0) ||
    Array.isArray(muc.images) ||
    typeof muc.imageUrl === 'string' ||
    typeof muc.thumbnailUrl === 'string';
  return coAnh ? 'anh_chu' : 'chu';
}

/**
 * URL kenh ma muc nay thuoc ve.
 *
 * Actor tra san `inputUrl` = dung URL da gui di, nen mot luot gop nhieu trang
 * van gan dung tung bai ve trang cua no. Khong co thi lui ve `facebookUrl`.
 */
export function urlKenhCuaMuc(muc: Record<string, unknown>): string | null {
  return chuoiAn(muc.inputUrl) || chuoiAn(muc.facebookUrl) || null;
}

/**
 * Tach rieng khoi loi goi mang de test duoc bang ban tho da luu, khong phai chay
 * lai actor — moi luot chay la tien that.
 */
export function bocMotBaiFanpage(muc: Record<string, unknown>): BaiKenhNgoai | null {
  const maBai =
    chuoiAn(muc.postId) || chuoiAn(muc.post_id) || chuoiAn(muc.source_post_id) || chuoiAn(muc.id);
  if (!maBai) return null;

  const tho = moBanTho(muc.raw_payload_json ?? muc.rawPayload ?? null) ?? muc;

  const noiDung =
    chuoiAn(muc.text) || chuoiAn(muc.message) || chuoiAn(muc.raw_text) || chuoiAn(muc.caption);

  const thoiLuongVideoMs =
    soLonNhat(muc, 'videoLengthMs') ?? soLonNhat(tho, 'playable_duration_in_ms');

  return {
    maBai,
    urlBai: chuoiAn(muc.url) || chuoiAn(muc.postUrl) || chuoiAn(muc.source_url) || null,
    noiDung,
    ngayDang: ngayAn(muc.time ?? muc.date ?? muc.timestamp ?? muc.created_at),
    dangBai: doanDangBai(muc, thoiLuongVideoMs),
    // Uu tien so o tang tren neu actor co tra; khong thi quet ban tho. Do that
    // cho ho so ca nhan: `stats` null het, moi con so nam trong ban tho.
    soThich: soLonNhat(muc, 'likes', 'likesCount') ?? soLonNhat(tho, 'reaction_count'),
    soBinhLuan:
      soLonNhat(muc, 'comments', 'commentsCount') ??
      soBinhLuanTu(tho) ??
      soLonNhat(tho, 'total_comment_count', 'comment_count'),
    soChiaSe: soLonNhat(muc, 'shares', 'sharesCount') ?? soLonNhat(tho, 'share_count'),
    thoiLuongVideoMs,
    tho,
  };
}

export const bocFanpage: BoBoc = {
  nguon: NGUON_FANPAGE,
  bocMotMuc: bocMotBaiFanpage,
  urlKenhCuaMuc,
};

/** Dau vao actor cho MOT NHOM trang — gop lai de chi tra phi khoi dong mot lan. */
export function dauVaoFanpage(urlTrang: string[], soBaiMoiTrang: number) {
  return {
    startUrls: urlTrang.map((url) => ({ url })),
    resultsLimit: soBaiMoiTrang,
  };
}
