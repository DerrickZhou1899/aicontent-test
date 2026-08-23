'use server';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { suaBanNhap } from '@/lib/studio/sua-ban-nhap';

export async function guiSuaBanNhap(thamSo: { contentId: string; noiDung: string }) {
  if (typeof thamSo?.contentId !== 'string' || typeof thamSo?.noiDung !== 'string') {
    return { ok: false as const, loi: 'Dữ liệu bản nháp không hợp lệ.', canhBao: [] };
  }
  return suaBanNhap({
    workspaceId : await workspaceHienTai(),
    contentId   : thamSo.contentId,
    noiDung     : thamSo.noiDung,
  });
}
