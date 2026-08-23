'use server';

import { revalidatePath } from 'next/cache';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { deXuatYTuong } from '@/lib/studio/de-xuat';
import type { BeMat, KetQuaStudio, YTuongDeXuat } from '@/lib/studio/kieu';

export type TrangThaiDeXuat = KetQuaStudio<YTuongDeXuat[]> | null;

export async function guiDeXuat(
  _trangThaiCu : TrangThaiDeXuat,
  form         : FormData,
): Promise<TrangThaiDeXuat> {
  const beMat   = form.get('beMat');
  const soLuong = Number(form.get('soLuong'));

  if (typeof beMat !== 'string') {
    return { ok: false, loi: 'Nơi đăng nội dung không hợp lệ.', canhBao: [] };
  }

  // Cả hai khóa cô lập đều lấy từ phiên, không tin giá trị do trình duyệt gửi lên.
  const workspaceId = await workspaceHienTai();
  const nguoiDung    = await nguoiDungHienTai();
  const ketQua       = await deXuatYTuong(
    { workspaceId, beMat: beMat as BeMat, soLuong },
    nguoiDung,
  );

  if (ketQua.ok) revalidatePath('/studio/de-xuat');
  return ketQua;
}
