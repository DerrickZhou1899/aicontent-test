'use server';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { luuBanNhapBai } from '@/lib/studio/luu-bai';
import { docAnh, sinhAnh } from '@/lib/studio/sinh-anh';
import {
  sinhBaiTuYTuong,
  type BanNhapBai,
} from '@/lib/studio/sinh-bai';
import {
  sinhKichBanTuYTuong,
  type BanNhapKichBan,
} from '@/lib/studio/sinh-kich-ban';
import type { KetQuaStudio } from '@/lib/studio/kieu';

type BanNhapTheoYTuong = {
  ideaId  : string;
  banNhap : BanNhapBai;
};
type KichBanTheoYTuong = {
  ideaId  : string;
  kichBan : BanNhapKichBan;
};

export type TrangThaiBienSoan = KetQuaStudio<BanNhapTheoYTuong> | null;
export type TrangThaiKichBan  = KetQuaStudio<KichBanTheoYTuong> | null;

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

export async function guiSinhKichBan(
  _trangThaiCu : TrangThaiKichBan,
  form         : FormData,
): Promise<TrangThaiKichBan> {
  const ideaId      = form.get('ideaId');
  const thoiLuong   = form.get('thoiLuongMucTieuGiay');
  if (typeof ideaId !== 'string' || ideaId.trim() === '') {
    return { ok: false, loi: 'Hãy chọn một ý tưởng để sinh kịch bản.', canhBao: [] };
  }

  const ketQua = await sinhKichBanTuYTuong({
    workspaceId              : await workspaceHienTai(),
    ideaId                   : ideaId.trim(),
    thoiLuongMucTieuGiay     : typeof thoiLuong === 'string' ? Number(thoiLuong) : undefined,
  });
  return ketQua.ok
    ? { ok: true, duLieu: { ideaId: ideaId.trim(), kichBan: ketQua.duLieu }, canhBao: ketQua.canhBao }
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

export async function guiSinhAnh(contentId: string) {
  if (typeof contentId !== 'string' || contentId.trim() === '') {
    return { ok: false as const, loi: 'Bài đăng không hợp lệ.', canhBao: [] };
  }
  return sinhAnh({
    workspaceId : await workspaceHienTai(),
    contentId   : contentId.trim(),
  });
}

export async function guiDocAnh(jobId: string) {
  if (typeof jobId !== 'string' || jobId.trim() === '') {
    return { ok: false as const, loi: 'Việc sinh ảnh không hợp lệ.', canhBao: [] };
  }
  return docAnh({
    workspaceId : await workspaceHienTai(),
    jobId       : jobId.trim(),
  });
}
