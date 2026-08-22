'use server';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { luuBanNhapBai } from '@/lib/studio/luu-bai';
import {
  sinhBaiTuYTuong,
  type BanNhapBai,
} from '@/lib/studio/sinh-bai';
import type { KetQuaStudio } from '@/lib/studio/kieu';

type BanNhapTheoYTuong = {
  ideaId  : string;
  banNhap : BanNhapBai;
};

export type TrangThaiBienSoan = KetQuaStudio<BanNhapTheoYTuong> | null;

export async function guiSinhBai(
  _trangThaiCu : TrangThaiBienSoan,
  form         : FormData,
): Promise<TrangThaiBienSoan> {
  const ideaId = form.get('ideaId');
  if (typeof ideaId !== 'string' || ideaId.trim() === '') {
    return { ok: false, loi: 'Hãy chọn một ý tưởng để biên soạn.', canhBao: [] };
  }

  const ketQua = await sinhBaiTuYTuong({
    workspaceId : await workspaceHienTai(),
    ideaId      : ideaId.trim(),
  });
  return ketQua.ok
    ? { ok: true, duLieu: { ideaId: ideaId.trim(), banNhap: ketQua.duLieu }, canhBao: ketQua.canhBao }
    : ketQua;
}

export async function luuBanNhap(thamSo: {
  ideaId  : string;
  tieuDe  : string;
  noiDung : string;
  hashtag : string;
}) {
  if (
    typeof thamSo.ideaId !== 'string'
    || typeof thamSo.tieuDe !== 'string'
    || typeof thamSo.noiDung !== 'string'
    || typeof thamSo.hashtag !== 'string'
  ) {
    return { ok: false as const, loi: 'Dữ liệu bản nháp không hợp lệ.', canhBao: [] };
  }

  const [workspaceId, nguoiDung] = await Promise.all([
    workspaceHienTai(),
    nguoiDungHienTai(),
  ]);
  return luuBanNhapBai({
    workspaceId,
    ideaId   : thamSo.ideaId,
    nguoiTao : nguoiDung.userId,
    banNhap  : {
      tieuDe  : thamSo.tieuDe,
      noiDung : thamSo.noiDung,
      hashtag : thamSo.hashtag.split(/\s+/),
    },
  });
}
