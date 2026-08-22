'use server';

/**
 * Hanh dong may chu cho cai dat kenh va luot keo bai.
 *
 * `workspaceId` luon doc tu phien dang nhap, khong bao gio nhan tu form.
 */

import { revalidatePath } from 'next/cache';

import { chuanUrlFacebook, chuanUrlTheoBeMat } from './chuan-url';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { createRepo } from '@/lib/data-access';
import type { BeMatTheoDoi, KenhKemTheoDoi } from '@/lib/data-access/kenh-theo-doi';
import { keoKenhDenHan, type KetQuaLuotTheoDoi } from '@/lib/keo-bai/keo-kenh-theo-doi';
import { keoVaLuuHoSoCaNhan, type KetQuaLuot } from '@/lib/keo-bai/luu-bai-keo-ve';
import { bocPhuDe } from '@/lib/keo-bai/phu-de-elevenlabs';

/** Tran mot luot keo. Luot 10 bai het 29 giay; vhost cat o 600 giay. */
const SO_BAI_TOI_DA = 30;

export type KetQuaLuuKenh = { ok: true; urlKenh: string } | { ok: false; loi: string };

export async function luuKenhCaNhan(urlTho: string): Promise<KetQuaLuuKenh> {
  const url = chuanUrlFacebook(urlTho);
  if (!url) {
    return {
      ok: false,
      loi: 'Cần một liên kết Facebook đầy đủ, ví dụ https://www.facebook.com/DangSangVN',
    };
  }

  const repo = createRepo(await workspaceHienTai());
  await repo.kenh.dat('ho_so_ca_nhan', url);
  revalidatePath('/cai-dat/kenh');
  revalidatePath('/bai-da-dang');
  return { ok: true, urlKenh: url };
}

export type KetQuaKeo = { ok: true; ket: KetQuaLuot } | { ok: false; loi: string };

export async function keoBaiVe(soBai: number): Promise<KetQuaKeo> {
  const workspaceId = await workspaceHienTai();
  const repo = createRepo(workspaceId);

  const kenh = await repo.kenh.theoBeMat('ho_so_ca_nhan');
  if (!kenh) return { ok: false, loi: 'Chưa lưu liên kết kênh cá nhân.' };

  const ket = await keoVaLuuHoSoCaNhan({
    workspaceId,
    kenhDangId: kenh.id,
    urlKenh: kenh.urlKenh,
    soBai: Math.min(Math.max(Math.trunc(soBai), 1), SO_BAI_TOI_DA),
  });

  revalidatePath('/bai-da-dang');
  revalidatePath('/cai-dat/kenh');
  return ket;
}

export type KetQuaPhuDeBai =
  | { ok: true; phuDe: string }
  | { ok: false; loi: string };

/**
 * Boc phu de cho mot video da keo ve.
 *
 * Chay theo yeu cau chu khong tu dong sau luot keo: moi lan goi la tien that o
 * ElevenLabs, va khong phai video nao cung dang boc.
 *
 * DIEU DANG BIET: lien ket video cua Facebook co chu ky va het han sau vai
 * ngay. Video keo ve tu lau bam nut nay se ra loi tai khong duoc — do khong
 * phai loi cau hinh, ma la lien ket da chet, phai keo lai bai do.
 */
export async function bocPhuDeVideo(assetId: string): Promise<KetQuaPhuDeBai> {
  const repo = createRepo(await workspaceHienTai());

  const asset = await repo.asset.layTheoId(assetId);
  if (!asset) return { ok: false, loi: 'Không tìm thấy video này.' };
  if (asset.loai !== 'video' || !asset.urlNgoai) {
    return { ok: false, loi: 'Mục này không phải video có liên kết.' };
  }
  if (asset.phuDe) return { ok: true, phuDe: asset.phuDe };

  const boc = await bocPhuDe(asset.urlNgoai);
  if (!boc.ok) return { ok: false, loi: boc.loi };

  await repo.asset.datPhuDe(assetId, boc.vanBan);
  revalidatePath('/bai-da-dang');
  return { ok: true, phuDe: boc.vanBan };
}

// ===========================================================================
// KENH THEO DOI — kenh cua NGUOI KHAC, de hoc chu de va cach ke.
//
// Khac hai ham tren ve mot diem quan trong: cac ham nay doc CA `workspaceId`
// LAN nguoi dung tu phien. Danh sach theo doi la rieng tung nguoi, nen `userId`
// lay tu form la doc duoc du lieu cua thanh vien khac.
// ===========================================================================

export async function danhSachKenhTheoDoi(): Promise<KenhKemTheoDoi[]> {
  const repo = createRepo(await workspaceHienTai());
  return repo.kenhTheoDoi.danhSachChoNguoi(await nguoiDungHienTai());
}

export type KetQuaThemKenh = { ok: true } | { ok: false; loi: string };

/**
 * Them kenh vao kho chung VA bat theo doi cho chinh nguoi vua them.
 *
 * Bat luon vi khong ai them mot kenh ma khong dinh theo doi no; bat rieng mot
 * buoc nua chi lam nguoi dung tuong da xong roi lai khong thay y tuong nao.
 */
export async function themKenhTheoDoi(
  beMat: BeMatTheoDoi,
  urlTho: string,
): Promise<KetQuaThemKenh> {
  const url = chuanUrlTheoBeMat(beMat, urlTho);
  if (!url) {
    return {
      ok: false,
      loi:
        beMat === 'tiktok'
          ? 'Cần liên kết TikTok dạng https://www.tiktok.com/@tenkenh'
          : 'Cần một liên kết Facebook đầy đủ, ví dụ https://www.facebook.com/tenkenh',
    };
  }

  const repo = createRepo(await workspaceHienTai());
  const kenh = await repo.kenhTheoDoi.themKenh(beMat, url);
  await repo.theoDoiCuaToi.bat(await nguoiDungHienTai(), kenh.id);

  revalidatePath('/cai-dat/kenh');
  revalidatePath('/studio/de-xuat');
  return { ok: true };
}

/** Bat/tat theo doi cho RIENG nguoi dang dang nhap. Khong dung toi nguoi khac. */
export async function datTheoDoi(kenhId: string, bat: boolean): Promise<void> {
  const repo = createRepo(await workspaceHienTai());
  const nguoi = await nguoiDungHienTai();
  if (bat) await repo.theoDoiCuaToi.bat(nguoi, kenhId);
  else await repo.theoDoiCuaToi.tat(nguoi, kenhId);

  revalidatePath('/cai-dat/kenh');
  revalidatePath('/studio/de-xuat');
}

/**
 * Tat kenh o muc WORKSPACE — anh huong ca nhom, nen man hinh hoi xac nhan truoc.
 *
 * Chi ngung keo, khong xoa bai da keo ve.
 */
export async function tatKenhTheoDoi(kenhId: string, dangHoatDong: boolean): Promise<void> {
  const repo = createRepo(await workspaceHienTai());
  await repo.kenhTheoDoi.datHoatDong(kenhId, dangHoatDong);
  revalidatePath('/cai-dat/kenh');
  revalidatePath('/studio/de-xuat');
}

export type KetQuaKeoTheoDoi =
  | { ok: true; ket: KetQuaLuotTheoDoi[] }
  | { ok: false; loi: string };

/**
 * Keo ngay bay gio, bo qua han gio.
 *
 * Nut nay de thu va de keo lan dau; lich tu dong o Phase 6 dung cung ham loi.
 */
export async function keoKenhTheoDoiNgay(): Promise<KetQuaKeoTheoDoi> {
  const ket = await keoKenhDenHan(await workspaceHienTai(), 0);
  revalidatePath('/cai-dat/kenh');
  revalidatePath('/studio/de-xuat');
  if (ket.length === 0) {
    return { ok: false, loi: 'Chưa có kênh nào đang theo dõi để kéo.' };
  }
  return { ok: true, ket };
}
