/**
 * Ba be mat keo duoc, va cach goi actor cua tung cai.
 *
 * TACH KHOI `keo-kenh-theo-doi.ts` vi tep do vuot 200 dong — quy uoc du an. Tach
 * theo dung ranh gioi nghiep vu: file nay tra loi "be mat nao goi actor nao, gia
 * bao nhieu", con file kia tra loi "mot luot keo dien ra the nao".
 *
 * Them mot be mat = them mot muc o day, khong dung toi dieu phoi.
 */

import type { KenhTheoDoi } from '@/lib/data-access/kenh-theo-doi';

import { ACTOR_FANPAGE, bocFanpage, dauVaoFanpage, uocTinhChiPhiFanpage } from './boc-fanpage';
import { ACTOR_HO_SO, bocHoSoCaNhan, dauVaoHoSo, uocTinhChiPhiHoSo } from './boc-ho-so-ca-nhan';
import { ACTOR_TIKTOK, bocTikTok, dauVaoTikTok, uocTinhChiPhiTikTok } from './boc-tiktok';
import type { BoBoc } from './kieu-bai-kenh-ngoai';

/** Du de thay kenh dang lam gi, va giu chi phi mot luot 8 kenh o muc ~$0,27. */
export const SO_BAI_MOI_KENH = 10;

export type NhomTheoBeMat = {
  beMat: KenhTheoDoi['beMat'];
  actor: string;
  boBoc: BoBoc;
  dauVao: (kenh: KenhTheoDoi[]) => Record<string, unknown>;
  uocTinh: (soKenh: number) => number;
  /** Actor gop duoc nhieu kenh trong mot luot hay phai chay tung kenh mot. */
  gopDuoc: boolean;
};

/**
 * Ba be mat, hai cach gop.
 *
 * Fanpage va TikTok nhan nhieu kenh mot luot nen chi tra phi khoi dong mot lan.
 * Ho so ca nhan thi `maxProfilesPerRun: 1` — N ho so la N luot chay, khong gop
 * duoc, va uoc tinh phai nhan theo so kenh.
 *
 * `zalo` khong co mat: chua co actor nao keo duoc, va de trong o day thi dieu
 * phoi tu bao "chua co bo boc cho be mat zalo" thay vi chay mot luot vo nghia.
 */
export const NHOM: Partial<Record<KenhTheoDoi['beMat'], NhomTheoBeMat>> = {
  fanpage: {
    beMat: 'fanpage',
    actor: ACTOR_FANPAGE,
    boBoc: bocFanpage,
    dauVao: (kenh) => dauVaoFanpage(kenh.map((k) => k.urlKenh), SO_BAI_MOI_KENH),
    uocTinh: (soKenh) => uocTinhChiPhiFanpage(soKenh, SO_BAI_MOI_KENH),
    gopDuoc: true,
  },
  tiktok: {
    beMat: 'tiktok',
    actor: ACTOR_TIKTOK,
    boBoc: bocTikTok,
    dauVao: (kenh) => dauVaoTikTok(kenh.map((k) => k.urlKenh), SO_BAI_MOI_KENH),
    uocTinh: (soKenh) => uocTinhChiPhiTikTok(soKenh, SO_BAI_MOI_KENH),
    gopDuoc: true,
  },
  ho_so_ca_nhan: {
    beMat: 'ho_so_ca_nhan',
    actor: ACTOR_HO_SO,
    boBoc: bocHoSoCaNhan,
    // `gopDuoc: false` nen mang luon chi co dung mot kenh.
    dauVao: (kenh) => dauVaoHoSo(kenh[0].urlKenh, SO_BAI_MOI_KENH),
    uocTinh: (soKenh) => uocTinhChiPhiHoSo(soKenh),
    gopDuoc: false,
  },
};
