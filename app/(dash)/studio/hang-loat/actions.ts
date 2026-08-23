'use server';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { luuHangLoat, type BaiCanLuu } from '@/lib/studio/luu-hang-loat';
import {
  sinhHangLoat,
  type ViecSinhBai,
} from '@/lib/studio/sinh-hang-loat';
import {
  docTrangThaiLo,
  type TrangThaiBaiTrongLo,
  type ViecTheoDoi,
} from '@/lib/studio/trang-thai-hang-loat';
import type { KetQuaStudio } from '@/lib/studio/kieu';

export type TrangThaiXepLo = KetQuaStudio<ViecSinhBai[]> | null;

export async function guiXepLo(
  _trangThaiCu : TrangThaiXepLo,
  form         : FormData,
): Promise<TrangThaiXepLo> {
  const ideaIds = form.getAll('ideaIds').filter((muc): muc is string => typeof muc === 'string');
  return sinhHangLoat({
    workspaceId : await workspaceHienTai(),
    ideaIds,
  });
}

export async function guiDocTrangThaiLo(
  viec: ViecTheoDoi[],
): Promise<KetQuaStudio<TrangThaiBaiTrongLo[]>> {
  if (!Array.isArray(viec) || viec.some((muc) => (
    typeof muc?.ideaId !== 'string' || typeof muc?.jobId !== 'string'
  ))) {
    return { ok: false, loi: 'Lô theo dõi không hợp lệ.', canhBao: [] };
  }
  return docTrangThaiLo({
    workspaceId : await workspaceHienTai(),
    viec,
  });
}

export async function guiLuuHangLoat(bai: BaiCanLuu[]) {
  const [workspaceId, nguoiDung] = await Promise.all([
    workspaceHienTai(),
    nguoiDungHienTai(),
  ]);
  return luuHangLoat({
    workspaceId,
    nguoiTao : nguoiDung.userId,
    bai,
  });
}
