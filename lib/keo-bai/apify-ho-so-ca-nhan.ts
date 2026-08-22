/**
 * Keo bai tu mot ho so Facebook ca nhan qua Apify.
 *
 * Actor: `spbotdel/facebook-profile-posts-all-photos-scraper` (PAY_PER_EVENT,
 * chay duoc tren goi FREE). Da chay that 13/08/2026: 10 bai ve trong 29 giay.
 *
 * BA DIEU DO DUOC TU LUOT CHAY THAT, khong phai tu tai lieu actor:
 *  1. `stats` cua actor tra ve `null` het cho ho so ca nhan. Moi con so deu
 *     nam trong `raw_payload_json`, o mot do sau bat ky, nen phai quet ca cay
 *     thay vi doc mot duong dan co dinh.
 *  2. So lieu duoc goi theo HAI dang trong cung mot ban tho: khi la so tran,
 *     khi la `{ count: N }`. Ban boc dau tien chi nhan dang so tran nen no bo
 *     qua con so THAT va vo phai mot con so khac — bai 112 luot thich bi ghi
 *     thanh 85, va binh luan/chia se bi ket luan nham la "khong co". Ca ba deu
 *     co: `reaction_count.count`, `comments.total_count`, `share_count.count`.
 *     `null` van nghia la khong do duoc, khac han 0 nghia la do duoc va bang 0.
 *  3. Mot video co toi 7 lien ket khac nhau (nhieu ban ma hoa). Lay ban dai
 *     nhat: chung deu tro cung mot video, ban co tham so day du nhat song lau
 *     hon truoc khi het han.
 */

import { chayActor } from './apify-chay-actor';
import { chuoiAn, moBanTho, ngayAn, soBinhLuanTu, soLonNhat } from './quet-cay-json';

export const ACTOR_HO_SO = 'spbotdel~facebook-profile-posts-all-photos-scraper';
export const NGUON_KEO = 'apify:spbotdel/facebook-profile-posts-all-photos-scraper';

/**
 * Do that 13/08/2026: 4 luot, moi luot $0,04995 bat ke so bai. Uoc tinh phang
 * theo luot chu khong theo bai — actor nay khong tinh tien theo bai nhu fanpage.
 */
export const GIA_MOI_LUOT_USD = 0.05;

export type AnhTrongBai = { maAnh: string | null; url: string };

export type BaiKeoVe = {
  maBai: string;
  urlBai: string | null;
  noiDung: string;
  ngayDang: Date | null;
  anh: AnhTrongBai[];
  urlVideo: string[];
  /** `null` = khong do duoc, KHAC 0. */
  soThich: number | null;
  soBinhLuan: number | null;
  soChiaSe: number | null;
  thoiLuongVideoMs: number | null;
  /** Ban tho nguyen van, de viet lai bo boc ma khong phai tra tien keo lai. */
  tho: unknown;
};

/**
 * Doi mot muc Apify tra ve thanh `BaiKeoVe`.
 *
 * Tach rieng khoi loi goi mang de test duoc bang du lieu that da luu, khong can
 * chay lai actor (moi luot chay la tien).
 */
export function bocMotBai(muc: Record<string, unknown>): BaiKeoVe | null {
  const maBai = chuoiAn(muc.source_post_id);
  if (!maBai) return null;

  const tho: unknown = moBanTho(muc.raw_payload_json ?? null);

  const anh: AnhTrongBai[] = (Array.isArray(muc.media) ? muc.media : [])
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .filter((m) => m.media_type === 'photo' && typeof m.source_url === 'string')
    .map((m) => ({
      maAnh: typeof m.source_media_id === 'string' ? m.source_media_id : null,
      url: m.source_url as string,
    }));

  // Nhieu ban ma hoa cua cung mot video — giu ban co chuoi tham so day du nhat.
  const urlVideo = (Array.isArray(muc.video_urls) ? muc.video_urls : [])
    .filter((u): u is string => typeof u === 'string')
    .sort((a, b) => b.length - a.length)
    .slice(0, 1);

  return {
    maBai,
    urlBai: typeof muc.source_url === 'string' ? muc.source_url : null,
    noiDung: chuoiAn(muc.raw_text),
    ngayDang: ngayAn(muc.created_at),
    anh,
    urlVideo,
    // Uu tien so o tang tren neu actor co tra; khong thi quet ban tho.
    // Do that 13/08/2026: voi ho so ca nhan, `stats` cua actor null het — moi
    // con so deu phai lay tu ban tho.
    soThich: soLonNhat(muc.stats, 'reactions') ?? soLonNhat(tho, 'reaction_count'),
    soBinhLuan:
      soLonNhat(muc.stats, 'comments') ??
      soBinhLuanTu(tho) ??
      soLonNhat(tho, 'total_comment_count', 'comment_count'),
    soChiaSe: soLonNhat(muc.stats, 'shares') ?? soLonNhat(tho, 'share_count'),
    thoiLuongVideoMs: soLonNhat(tho, 'playable_duration_in_ms'),
    tho: tho ?? muc,
  };
}

export type KetQuaKeo =
  | { ok: true; bai: BaiKeoVe[] }
  | { ok: false; loi: string };

/**
 * Chay actor va tra ve danh sach bai da boc.
 *
 * Phan goi mang nam o `apify-chay-actor.ts` — dung chung voi cac bo boc kenh
 * ngoai. CHU KY HAM VA KIEU TRA VE GIU NGUYEN de `luu-bai-keo-ve.ts` va man cai
 * dat kenh khong phai sua mot dong nao.
 *
 * Luot nay di qua cong chan chi phi voi loai `'loi'`: day la tinh nang loi dang
 * chay production, khong duoc chet vi tinh nang theo doi kenh ngoai tieu het
 * han muc.
 */
export async function keoHoSoCaNhan(thamSo: {
  urlKenh: string;
  soBai: number;
}): Promise<KetQuaKeo> {
  const ket = await chayActor({
    actor: ACTOR_HO_SO,
    loaiLuot: 'loi',
    uocTinhUsd: GIA_MOI_LUOT_USD,
    dauVao: {
      profileUrls: [thamSo.urlKenh],
      maxProfilesPerRun: 1,
      maxPostsPerProfile: thamSo.soBai,
      expandAllPhotos: true,
      includeRawPayload: true,
    },
  });

  if (!ket.ok) return { ok: false, loi: ket.loi };

  const bai = ket.muc.map(bocMotBai).filter((b): b is BaiKeoVe => b !== null);

  if (bai.length === 0) {
    return {
      ok: false,
      loi: 'Không lấy được bài nào. Hồ sơ có thể để chế độ riêng tư, hoặc tài khoản Apify hết số dư.',
    };
  }

  return { ok: true, bai };
}
