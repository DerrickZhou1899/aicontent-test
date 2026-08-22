/**
 * Dieu phoi mot luot keo kenh NGUOI KHAC theo doi.
 *
 * NGUYEN TAC XUYEN SUOT FILE NAY: sau khi actor chay xong la tien da mat, khong
 * hoan duoc. Tu giay phut do, moi duong di deu phai huong toi "giu lai duoc bao
 * nhieu hay bay nhieu", KHONG duoc nem loi len hang doi.
 *
 * Vi sao quan trong den vay: `lib/queue/claim.js` thu lai toi 3 lan. Neu mot loi
 * boc o kenh thu 5 lam ca luot hong, lan thu lai se chon lai dung nhom kenh do
 * (vi `lan_keo_cuoi` chua duoc cap nhat) va GOI ACTOR LAI TU DAU — tra tien lan
 * hai, co the toi bon lan truoc khi viec chet han.
 *
 * Ba thu chan dieu do:
 *   1. Chay actor MOT lan cho ca nhom (fanpage gop duoc nhieu trang).
 *   2. Ghi + cap nhat `lan_keo_cuoi` TUNG KENH, moi kenh mot buoc doc lap. Kenh
 *      da ghi xong khong bao gio bi keo lai.
 *   3. Loi o mot kenh chi thanh CANH BAO, khong lam hong luot. Luot keo tra ve
 *      "xong kem canh bao" chu khong tra ve loi.
 */

import { createRepo } from '@/lib/data-access';
import type { KenhTheoDoi } from '@/lib/data-access/kenh-theo-doi';

import { chayActor } from './apify-chay-actor';
import { NHOM, SO_BAI_MOI_KENH } from './cau-hinh-be-mat';
import { ganMucVeKenh } from './gan-muc-ve-kenh';

export type KetQuaLuotTheoDoi = {
  soKenhKeo: number;
  soBaiMoi: number;
  chiPhiUsd: number | null;
  uocTinhUsd: number;
  /** Bo luot co kiem soat (cham nguong chi phi) — KHONG phai loi. */
  boLuot: boolean;
  lyDoBoLuot: string | null;
  /** Loi khong chan luot chay: mot kenh boc hong, mot kenh ghi hong. */
  canhBao: string[];
};

/**
 * Keo mot nhom kenh CUNG BE MAT.
 *
 * Tra ve ket qua ke ca khi co canh bao. Chi tra ve `boLuot: true` khi cong chan
 * chi phi khong cho chay — truong hop do KHONG ton dong nao.
 */
export async function keoNhomKenh(
  workspaceId: string,
  kenh: KenhTheoDoi[],
): Promise<KetQuaLuotTheoDoi> {
  const canhBao: string[] = [];
  const rong: KetQuaLuotTheoDoi = {
    soKenhKeo: 0,
    soBaiMoi: 0,
    chiPhiUsd: null,
    uocTinhUsd: 0,
    boLuot: false,
    lyDoBoLuot: null,
    canhBao,
  };
  if (kenh.length === 0) return rong;

  const nhom = NHOM[kenh[0].beMat];
  if (!nhom) {
    canhBao.push(`Chưa có bộ bóc cho bề mặt ${kenh[0].beMat}`);
    return rong;
  }

  const uocTinhUsd = nhom.uocTinh(kenh.length);
  const ket = await chayActor({
    actor: nhom.actor,
    dauVao: nhom.dauVao(kenh),
    uocTinhUsd,
    loaiLuot: 'theo-doi',
  });

  if (!ket.ok) {
    // Bo luot vi cham nguong: khong ton tien, khong phai loi. Moi truong hop
    // khac la loi that nhung VAN khong nem — hang doi thu lai chi ton them tien.
    return {
      ...rong,
      uocTinhUsd,
      boLuot: ket.boLuot,
      lyDoBoLuot: ket.boLuot ? ket.loi : null,
      canhBao: ket.boLuot ? canhBao : [...canhBao, ket.loi],
    };
  }

  // ==== TU DAY TRO DI TIEN DA MAT. Giu duoc bao nhieu hay bay nhieu. ====

  const repo = createRepo(workspaceId);

  const { theoKenh, soKhongGan } = ganMucVeKenh(ket.muc, kenh, nhom.boBoc);
  if (soKhongGan > 0) {
    canhBao.push(`${soKhongGan} bài không gán được về kênh nào, đã bỏ qua.`);
  }

  let soBaiMoi = 0;
  let soKenhKeo = 0;
  const moc = new Date();

  for (const k of kenh) {
    const muc = theoKenh.get(k.id) ?? [];
    try {
      const bai = muc
        .map((m) => nhom.boBoc.bocMotMuc(m))
        .filter((b): b is NonNullable<typeof b> => b !== null);

      if (bai.length > 0) {
        soBaiMoi += await repo.tinHieuXuHuong.luuNhieu(
          bai.map((b) => ({
            kenhTheoDoiId: k.id,
            nguon: nhom.boBoc.nguon,
            maBai: b.maBai,
            lienKet: b.urlBai,
            noiDung: b.noiDung,
            thoiDiem: b.ngayDang,
            dangBai: b.dangBai,
            soThich: b.soThich,
            soBinhLuan: b.soBinhLuan,
            soChiaSe: b.soChiaSe,
            thoiLuongVideoMs: b.thoiLuongVideoMs,
            tho: b.tho,
          })),
        );
      } else {
        canhBao.push(`${k.urlKenh}: kéo về 0 bài (hồ sơ riêng tư hoặc URL sai bề mặt?)`);
      }

      // Cap nhat NGAY sau khi kenh nay ghi xong: lan thu lai khong keo lai no nua.
      await repo.kenhTheoDoi.capNhatLanKeoCuoi(k.id, moc);
      soKenhKeo += 1;
    } catch (loi) {
      canhBao.push(`${k.urlKenh}: ghi hỏng — ${(loi as Error).message}`);
    }
  }

  // Ghi so bang USD. `don_vi_tien` PHAI la 'USD': cot nay mac dinh 'VND' va
  // `tongTheoThang()` cong theo don vi — do USD vao o VND la sai co ti gia tren
  // chinh bang dung de dat gia ban.
  try {
    await repo.costLog.ghi({
      loaiChiPhi: 'apify',
      soLuong: String(kenh.length),
      chiPhiUocTinh: String(ket.chiPhiUsd ?? uocTinhUsd),
      donViTien: 'USD',
      ghiChu: `keo-kenh-theo-doi ${nhom.beMat} run=${ket.runId} uoc-tinh=${uocTinhUsd.toFixed(4)}`,
    });
  } catch (loi) {
    canhBao.push(`Không ghi được sổ chi phí: ${(loi as Error).message}`);
  }

  // Doi chieu uoc tinh voi chi phi that — cach DUY NHAT phat hien Apify doi gia.
  if (ket.chiPhiUsd !== null && uocTinhUsd > 0) {
    const lech = Math.abs(ket.chiPhiUsd - uocTinhUsd) / uocTinhUsd;
    if (lech > 0.3) {
      canhBao.push(
        `Chi phí lệch ${(lech * 100).toFixed(0)}%: ước tính ${uocTinhUsd.toFixed(4)} USD, ` +
          `thật ${ket.chiPhiUsd.toFixed(4)} USD. Kiểm tra đơn giá actor có đổi không.`,
      );
    }
  }

  return {
    soKenhKeo,
    soBaiMoi,
    chiPhiUsd: ket.chiPhiUsd,
    uocTinhUsd,
    boLuot: false,
    lyDoBoLuot: null,
    canhBao,
  };
}

/** Keo moi kenh den han cua mot workspace, gom theo be mat. */
export async function keoKenhDenHan(
  workspaceId: string,
  hanGio: number,
): Promise<KetQuaLuotTheoDoi[]> {
  const repo = createRepo(workspaceId);
  const kenh = await repo.kenhTheoDoi.canKeo(hanGio);

  const theoBeMat = new Map<KenhTheoDoi['beMat'], KenhTheoDoi[]>();
  for (const k of kenh) {
    const da = theoBeMat.get(k.beMat) ?? [];
    da.push(k);
    theoBeMat.set(k.beMat, da);
  }

  const ket: KetQuaLuotTheoDoi[] = [];
  for (const [beMat, nhomKenh] of theoBeMat) {
    const nhom = NHOM[beMat];
    // Actor khong gop duoc thi chay tung kenh mot — hai be mat kia (Phase 5).
    if (nhom && !nhom.gopDuoc) {
      for (const k of nhomKenh) ket.push(await keoNhomKenh(workspaceId, [k]));
    } else {
      ket.push(await keoNhomKenh(workspaceId, nhomKenh));
    }
  }
  return ket;
}
