/**
 * Lop goi Apify dung chung cho moi actor.
 *
 * VI SAO CHAY BAT DONG BO ROI HOI LAI thay vi `run-sync-get-dataset-items`:
 * dang `run-sync` tra thang mang ket qua nhung KHONG tra chi phi that cua luot
 * chay. Ma chi phi that (`usageTotalUsd`) la thu duy nhat phat hien duoc Apify
 * doi don gia — don gia trong ma la hang so chep ngay 13/08/2026, khong doi
 * chieu thi lan doi gia sau se am tham pha cong chan chi phi.
 *
 * Doi lai: mot luot la ba loi goi (chay -> hoi trang thai -> lay du lieu) thay
 * vi mot. Voi luot 10 bai het ~30 giay thi khong dang ke.
 */

import { conChoDeKeo, type LoaiLuot } from './tran-chi-phi-apify';

const GOC = 'https://api.apify.com/v2';
/** Vhost cho 600 giay; chua cho phan boc va ghi. */
const HET_GIO_GIAY = 420;
const NHIP_HOI_MS = 2_000;

export type KetQuaChay =
  | { ok: true; muc: Record<string, unknown>[]; chiPhiUsd: number | null; runId: string }
  | { ok: false; loi: string; boLuot: boolean };

type RunApify = {
  data?: {
    id?: string;
    status?: string;
    defaultDatasetId?: string;
    usageTotalUsd?: number;
  };
};

const XONG = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);

/**
 * Chay mot actor va tra ve muc du lieu kem chi phi that.
 *
 * `uocTinhUsd` di thang vao cong chan chi phi. Cong tra `chay: false` thi ham
 * nay tra `boLuot: true` — nguoi goi phai coi day la BO LUOT CO KIEM SOAT, khong
 * phai loi: viec trong hang doi bo luot van phai ket thuc o trang thai `xong`,
 * neu khong hang doi se thu lai vo han.
 */
export async function chayActor(thamSo: {
  actor: string;
  dauVao: Record<string, unknown>;
  uocTinhUsd: number;
  loaiLuot?: LoaiLuot;
}): Promise<KetQuaChay> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return { ok: false, loi: 'Chưa cấu hình APIFY_TOKEN trên máy chủ.', boLuot: true };
  }

  const cong = await conChoDeKeo(thamSo.uocTinhUsd, thamSo.loaiLuot ?? 'theo-doi');
  if (!cong.chay) {
    return { ok: false, loi: `Bỏ lượt kéo: ${cong.lyDo}`, boLuot: true };
  }

  const dauHeader = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 1. Khoi chay. Tien mat o day, khong hoan duoc.
  let run: RunApify;
  try {
    const phanHoi = await fetch(
      `${GOC}/acts/${thamSo.actor}/runs?timeout=${HET_GIO_GIAY}`,
      {
        method: 'POST',
        headers: dauHeader,
        body: JSON.stringify(thamSo.dauVao),
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!phanHoi.ok) {
      // KHONG kem than phan hoi: no co the chua lai token.
      return {
        ok: false,
        loi: `Apify trả về lỗi ${phanHoi.status}. Kiểm tra token và số dư.`,
        boLuot: false,
      };
    }
    run = (await phanHoi.json()) as RunApify;
  } catch (loi) {
    return { ok: false, loi: `Không gọi được Apify: ${(loi as Error).message}`, boLuot: false };
  }

  const runId = run.data?.id;
  if (!runId) return { ok: false, loi: 'Apify không trả mã lượt chạy.', boLuot: false };

  // 2. Hoi lai cho toi khi xong.
  const hanChot = Date.now() + HET_GIO_GIAY * 1000;
  let cuoi = run;
  while (!XONG.has(cuoi.data?.status ?? '')) {
    if (Date.now() > hanChot) {
      return { ok: false, loi: `Lượt chạy ${runId} quá hạn ${HET_GIO_GIAY} giây.`, boLuot: false };
    }
    await new Promise((nghi) => setTimeout(nghi, NHIP_HOI_MS));
    try {
      const phanHoi = await fetch(`${GOC}/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!phanHoi.ok) continue;
      cuoi = (await phanHoi.json()) as RunApify;
    } catch {
      // Truc trac mang giua chung khong phai ly do bo luot da tra tien — hoi lai.
    }
  }

  const chiPhiUsd = typeof cuoi.data?.usageTotalUsd === 'number' ? cuoi.data.usageTotalUsd : null;

  if (cuoi.data?.status !== 'SUCCEEDED') {
    return {
      ok: false,
      loi: `Lượt chạy ${runId} kết thúc ở trạng thái ${cuoi.data?.status}.`,
      boLuot: false,
    };
  }

  // 3. Lay du lieu. Dataset bi Apify xoa sau 7 ngay nen phai ghi ve CSDL ngay.
  const datasetId = cuoi.data?.defaultDatasetId;
  if (!datasetId) return { ok: false, loi: 'Lượt chạy không có dataset.', boLuot: false };

  let muc: unknown;
  try {
    const phanHoi = await fetch(`${GOC}/datasets/${datasetId}/items?clean=true`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(120_000),
    });
    if (!phanHoi.ok) {
      return { ok: false, loi: `Không đọc được dữ liệu lượt chạy (${phanHoi.status}).`, boLuot: false };
    }
    muc = await phanHoi.json();
  } catch (loi) {
    return { ok: false, loi: `Không đọc được dữ liệu: ${(loi as Error).message}`, boLuot: false };
  }

  if (!Array.isArray(muc)) {
    return { ok: false, loi: 'Apify trả về dữ liệu không đúng dạng.', boLuot: false };
  }

  return {
    ok: true,
    runId,
    chiPhiUsd,
    muc: muc.filter((m): m is Record<string, unknown> => !!m && typeof m === 'object'),
  };
}
