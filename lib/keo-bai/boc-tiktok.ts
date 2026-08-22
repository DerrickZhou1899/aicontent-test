/**
 * Boc video tu kenh TikTok — actor `clockworks/tiktok-scraper`.
 *
 * Gia do ngay 13/08/2026 o bac FREE (`GET /v2/store`): PAY_PER_EVENT,
 * `$0,0037/video` + `$0,001/luot`. RE HON facebook moi mon.
 *
 * PHU DE TAT MAC DINH, va day la quyet dinh ve tien chu khong phai ve ky thuat:
 * su kien `transcription-minute` gia `$0,048/PHUT` — 20 video mot phut la $0,96,
 * bang 290 video khong phu de. Caption TikTok thuong CHINH LA hook, du de boc
 * `kieuHook` va `chuDe`. Bat phu de la viec bam tay tung video, neu do that cho
 * thay caption khong du.
 *
 * KHONG DUNG ElevenLabs cho TikTok: actor nay tu boc chu duoc, nen bat phu de
 * sau nay cung khong them mot nha cung cap nao. `phu-de-elevenlabs.ts` giu
 * nguyen cho luong bai cua minh.
 *
 * DAU VAO LA TEN TAI KHOAN (`@ten`), khong phai URL — khac hai actor Facebook.
 */

import type { BaiKenhNgoai, BoBoc } from './kieu-bai-kenh-ngoai';
import { chuoiAn, ngayAn, soLonNhat } from './quet-cay-json';

export const ACTOR_TIKTOK = 'clockworks~tiktok-scraper';
export const NGUON_TIKTOK = 'apify:clockworks/tiktok-scraper';

/** Don gia bac FREE, do 13/08/2026. */
export const GIA_MOI_VIDEO_USD = 0.0037;
export const GIA_KHOI_DONG_USD = 0.001;

export function uocTinhChiPhiTikTok(soKenh: number, soVideoMoiKenh: number): number {
  return soKenh * soVideoMoiKenh * GIA_MOI_VIDEO_USD + GIA_KHOI_DONG_USD;
}

/** `https://www.tiktok.com/@ten` -> `@ten`. Actor nhan ten, khong nhan URL. */
export function tenTaiKhoanTuUrl(url: string): string | null {
  try {
    const duongDan = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
    const dau = duongDan.split('/')[0];
    return dau.startsWith('@') && dau.length > 1 ? dau : null;
  } catch {
    return null;
  }
}

/**
 * Muc TikTok -> hinh dang chung.
 *
 * Hai cho de sai, deu do bang du lieu that:
 *   - `videoMeta.duration` tinh bang GIAY (159), luoc do luu MILI GIAY.
 *   - Luot chay khong tim thay video van tra ve mot muc, nhung muc do chi co
 *     `authorMeta` + `note` ("No videos found to match the filter") va khong co
 *     `id`. Bo qua chu khong ghi mot dong rong.
 */
export function bocMotVideoTikTok(muc: Record<string, unknown>): BaiKenhNgoai | null {
  const maBai = chuoiAn(muc.id);
  if (!maBai) return null;

  const videoMeta = (muc.videoMeta ?? {}) as Record<string, unknown>;
  const giay = typeof videoMeta.duration === 'number' ? videoMeta.duration : null;

  return {
    maBai,
    urlBai: chuoiAn(muc.webVideoUrl) || null,
    // Caption. Rong la binh thuong tren TikTok — bai van co ich nho so lieu.
    noiDung: chuoiAn(muc.text),
    ngayDang: ngayAn(muc.createTimeISO),
    // Moi thu tren TikTok deu la video.
    dangBai: 'kich_ban_quay',
    soThich: soLonNhat(muc, 'diggCount'),
    soBinhLuan: soLonNhat(muc, 'commentCount'),
    soChiaSe: soLonNhat(muc, 'shareCount'),
    thoiLuongVideoMs: giay === null ? null : Math.round(giay * 1000),
    tho: muc,
  };
}

/** Actor tra san `input` = dung `@ten` da gui di. */
export function tenKenhCuaMuc(muc: Record<string, unknown>): string | null {
  const tuInput = chuoiAn(muc.input);
  if (tuInput.startsWith('@')) return tuInput;
  const tacGia = (muc.authorMeta ?? {}) as Record<string, unknown>;
  const ten = chuoiAn(tacGia.name);
  return ten ? `@${ten}` : null;
}

/** Doi ve URL day du de khop voi `kenh_theo_doi.url_kenh`. */
export function urlKenhCuaMucTikTok(muc: Record<string, unknown>): string | null {
  const ten = tenKenhCuaMuc(muc);
  return ten ? `https://www.tiktok.com/${ten}` : null;
}

export const bocTikTok: BoBoc = {
  nguon: NGUON_TIKTOK,
  bocMotMuc: bocMotVideoTikTok,
  urlKenhCuaMuc: urlKenhCuaMucTikTok,
};

/**
 * Dau vao actor cho mot nhom kenh.
 *
 * `downloadSubtitlesOptions: 'NEVER_DOWNLOAD_SUB'` viet TUONG MINH du no la mac
 * dinh cua actor: mac dinh cua ben thu ba doi luc nao khong ai bao, va doi o day
 * nghia la hoa don nhay 13 lan.
 */
export function dauVaoTikTok(urlKenh: string[], soVideoMoiKenh: number) {
  return {
    profiles: urlKenh.map(tenTaiKhoanTuUrl).filter((t): t is string => t !== null),
    resultsPerPage: soVideoMoiKenh,
    profileScrapeSections: ['videos'],
    profileSorting: 'latest',
    downloadSubtitlesOptions: 'NEVER_DOWNLOAD_SUB',
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadAvatars: false,
    shouldDownloadSlideshowImages: false,
    shouldDownloadMusicCovers: false,
    aiVideoDescription: false,
    aiVideoSummary: false,
  };
}
