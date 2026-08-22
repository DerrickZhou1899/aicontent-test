'use server';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import {
  sinhBaiTuYTuong,
  type BanNhapBai,
} from '@/lib/studio/sinh-bai';
import type { KetQuaStudio } from '@/lib/studio/kieu';

export type TrangThaiBienSoan = KetQuaStudio<BanNhapBai> | null;

export async function guiSinhBai(
  _trangThaiCu : TrangThaiBienSoan,
  form         : FormData,
): Promise<TrangThaiBienSoan> {
  const ideaId = form.get('ideaId');
  if (typeof ideaId !== 'string' || ideaId.trim() === '') {
    return { ok: false, loi: 'Hãy chọn một ý tưởng để biên soạn.', canhBao: [] };
  }

  return sinhBaiTuYTuong({
    workspaceId : await workspaceHienTai(),
    ideaId      : ideaId.trim(),
  });
}
