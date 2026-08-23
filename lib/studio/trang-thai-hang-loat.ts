import { donKetQuaSinhBai, type BanNhapBai } from './sinh-bai';
import type { KetQuaStudio } from './kieu';

export type ViecTheoDoi = {
  ideaId : string;
  jobId  : string;
};

export type TrangThaiBaiTrongLo = ViecTheoDoi & {
  trangThai : string;
  banNhap   : BanNhapBai | null;
  loi       : string | null;
};

export type ThamSoDocTrangThaiLo = {
  workspaceId : string;
  viec        : ViecTheoDoi[];
};

type DongJob = {
  id         : string;
  trangThai : string;
  ketQua    : Record<string, unknown> | null;
  loi       : string | null;
};
type RepoTrangThaiLo = {
  jobs : { layNhieuTheoId : (ids: string[]) => Promise<DongJob[]> };
};
export type PhuThuocTrangThaiLo = {
  createRepo : (workspaceId: string) => RepoTrangThaiLo;
};

function ketQuaLoi(loi: string): KetQuaStudio<TrangThaiBaiTrongLo[]> {
  return { ok: false, loi, canhBao: [] };
}

async function phuThuocMacDinh(): Promise<PhuThuocTrangThaiLo> {
  const tangTruyCap = await import('@/lib/data-access');
  return {
    createRepo : tangTruyCap.createRepo as unknown as PhuThuocTrangThaiLo['createRepo'],
  };
}

function donViec(viec: ViecTheoDoi[]): ViecTheoDoi[] | null {
  if (!Array.isArray(viec) || viec.length === 0 || viec.length > 10) return null;
  if (viec.some((muc) => (
    typeof muc?.ideaId !== 'string'
    || muc.ideaId.trim() === ''
    || typeof muc.jobId !== 'string'
    || muc.jobId.trim() === ''
  ))) return null;
  const sach = viec.map((muc) => ({ ideaId: muc.ideaId.trim(), jobId: muc.jobId.trim() }));
  return new Set(sach.map((muc) => muc.ideaId)).size === sach.length
    && new Set(sach.map((muc) => muc.jobId)).size === sach.length
    ? sach
    : null;
}

function donTrangThai(viec: ViecTheoDoi, job: DongJob): TrangThaiBaiTrongLo {
  if (job.trangThai === 'xong') {
    const banNhap = donKetQuaSinhBai(job.ketQua);
    return banNhap
      ? { ...viec, trangThai: 'xong', banNhap, loi: null }
      : { ...viec, trangThai: 'loi', banNhap: null, loi: 'Kết quả tạo bài không hợp lệ.' };
  }
  if (job.trangThai === 'loi' || job.trangThai === 'huy') {
    return { ...viec, trangThai: job.trangThai, banNhap: null, loi: 'Không thể tạo bài này.' };
  }
  return { ...viec, trangThai: job.trangThai, banNhap: null, loi: null };
}

export function taoDichVuDocTrangThaiLo(phuThuocCoDinh?: PhuThuocTrangThaiLo) {
  return async (
    thamSo: ThamSoDocTrangThaiLo,
  ): Promise<KetQuaStudio<TrangThaiBaiTrongLo[]>> => {
    const viec = donViec(thamSo.viec);
    if (!viec) return ketQuaLoi('Lô theo dõi không hợp lệ.');

    let jobs: DongJob[];
    try {
      const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
      const repo     = phuThuoc.createRepo(thamSo.workspaceId);
      jobs           = await repo.jobs.layNhieuTheoId(viec.map((muc) => muc.jobId));
    } catch {
      return ketQuaLoi('Không thể đọc trạng thái lô. Hãy thử lại.');
    }
    const theoId = new Map(jobs.map((job) => [job.id, job]));
    if (viec.some((muc) => !theoId.has(muc.jobId))) {
      return ketQuaLoi('Có việc không thuộc không gian làm việc này.');
    }
    return {
      ok       : true,
      duLieu   : viec.map((muc) => donTrangThai(muc, theoId.get(muc.jobId)!)),
      canhBao  : [],
    };
  };
}

const dichVuMacDinh = taoDichVuDocTrangThaiLo();

export async function docTrangThaiLo(
  thamSo: ThamSoDocTrangThaiLo,
): Promise<KetQuaStudio<TrangThaiBaiTrongLo[]>> {
  return dichVuMacDinh(thamSo);
}
