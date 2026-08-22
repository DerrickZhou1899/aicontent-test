/**
 * Chu ky co kieu cua lop truu tuong goi mo hinh (PRD muc 8.2).
 *
 * Vi sao co file khai bao rieng: phan cai dat o `index.js` phai chay duoc bang
 * `node` tran (worker duoi pm2 va `node --test` deu khong doc `.ts` tren Node
 * 20). Tep nay giu phan kiem kieu cho ben goi trong `app/` — go sai ten nhiem vu
 * la hong luc bien dich chu khong phai luc nguoi dung bam nut.
 */

import type { Pool, PoolClient } from 'pg';

export type NhiemVuMoHinh =
  | 'viet-bai'
  | 'viet-kich-ban'
  | 'de-xuat-y-tuong'
  | 'cham-chat-luong'
  | 'phan-loai-binh-luan'
  | 'boc-tach-ho-so'
  | 'cham-diem-lien-quan';

export type LuaChonMoHinh = 'claude-cli' | 'codex-cli' | 'auto';

export type TrangThaiViec = 'cho' | 'dang_chay' | 'xong' | 'loi' | 'huy';

export interface ThamSoChayNhiemVu {
  nhiemVu: NhiemVuMoHinh;
  duLieuVao: Record<string, unknown>;
  moHinh?: LuaChonMoHinh;
  khongGianLamViec: string;
  /** Mac dinh `true`: cho worker chay xong roi tra ket qua. */
  cho?: boolean;
  /** `null` = tat chan trung cho viec nay. Bo trong = tu sinh tu noi dung viec. */
  khoaChongTrung?: string | null;
  hetGioChoMs?: number;
  khachHang?: Pool | PoolClient;
}

export interface KetQuaChayNhiemVu {
  jobId: string;
  trangThai: TrangThaiViec;
  /** `false` nghia la da co viec y het dang cho — dung lai ket qua cua no. */
  moi: boolean;
  moHinh: string;
  ketQua: Record<string, unknown> | null;
  loi: string | null;
}

export declare const HET_GIO_CHO_MS: number;

export declare function chayNhiemVu(
  thamSo: ThamSoChayNhiemVu,
): Promise<KetQuaChayNhiemVu>;

export declare function layKetQua(
  jobId: string,
  khachHang?: Pool | PoolClient,
): Promise<Pick<KetQuaChayNhiemVu, 'trangThai' | 'ketQua' | 'loi'>>;
