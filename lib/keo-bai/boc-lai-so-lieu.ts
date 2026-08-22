/**
 * Chay lai bo boc so lieu tren cac ban tho DA LUU.
 *
 * Day la khoan loi cua viec giu ban tho nguyen van: bo boc dem sai — va no da
 * dem sai that, vi so lieu cua Facebook khi la so tran khi la `{count: N}` —
 * thi sua ham roi chay lai tren toan bo lich su, KHONG ton mot luot goi Apify
 * nao. Neu chi luu con so da boc thi cach duy nhat sua la keo lai tat ca, va
 * moi luot keo la tien that.
 */

import { createRepo } from '@/lib/data-access';

import { bocMotBai } from './apify-ho-so-ca-nhan';

export type KetQuaBocLai = {
  soBan: number;
  soDoi: number;
  /** Ban tho khong boc ra duoc con so nao — dinh dang la, hoac bai that su khong co so lieu. */
  soTrong: number;
};

export async function bocLaiSoLieu(workspaceId: string): Promise<KetQuaBocLai> {
  const repo = createRepo(workspaceId);
  const contentIds = (await repo.contents.list({ trangThai: 'da_dang', gioiHan: 500 })).map(
    (b) => b.id,
  );
  const ban = await repo.baiKeoTho.theoNhieuContentId(contentIds);

  let soDoi = 0;
  let soTrong = 0;

  for (const b of ban) {
    // `bocMotBai` cho mot muc Apify; o day ta chi con ban tho. Boc lai bang cach
    // dung lai chinh ham do voi ban tho dat vao dung cho no doc — nho vay chi co
    // MOT ban boc trong ca du an, khong co ban thu hai lech dan theo thoi gian.
    const boc = bocMotBai({ source_post_id: b.maBai, raw_payload_json: b.duLieu });
    if (!boc) continue;

    const co =
      boc.soThich !== null ||
      boc.soBinhLuan !== null ||
      boc.soChiaSe !== null ||
      boc.thoiLuongVideoMs !== null;
    if (!co) {
      soTrong += 1;
      continue;
    }

    const doi =
      boc.soThich !== b.soThich ||
      boc.soBinhLuan !== b.soBinhLuan ||
      boc.soChiaSe !== b.soChiaSe ||
      boc.thoiLuongVideoMs !== b.thoiLuongVideoMs;

    if (doi) {
      await repo.baiKeoTho.ghiDeSoLieu(b.id, {
        soThich: boc.soThich,
        soBinhLuan: boc.soBinhLuan,
        soChiaSe: boc.soChiaSe,
        thoiLuongVideoMs: boc.thoiLuongVideoMs,
      });
      soDoi += 1;
    }
  }

  return { soBan: ban.length, soDoi, soTrong };
}
