import type { KetQuaStudio } from './kieu';

export type AnhDaSinh = {
  assetId  : string;
  duongDan : string;
  tiLe     : '1:1';
};

export type TrangThaiSinhAnh = {
  trangThai : string;
  anh       : AnhDaSinh | null;
  loi       : string | null;
};

type RepoSinhAnh = {
  contents : { layTheoId : (id: string) => Promise<{ id: string } | null> };
  jobs     : { layTheoId : (id: string) => Promise<{
    trangThai : string;
    ketQua    : Record<string, unknown> | null;
    loi       : string | null;
  } | null> };
};

type KetQuaXep = { jobId: string; trangThai: string };

export type PhuThuocSinhAnh = {
  createRepo  : (workspaceId: string) => RepoSinhAnh;
  chayNhiemVu : (thamSo: Record<string, unknown>) => Promise<KetQuaXep>;
};

function ketQuaLoi<T>(loi: string): KetQuaStudio<T> {
  return { ok: false, loi, canhBao: [] };
}

async function phuThuocMacDinh(): Promise<PhuThuocSinhAnh> {
  const [tangTruyCap, boChayMoHinh] = await Promise.all([
    import('@/lib/data-access'),
    import('@/lib/model-runner'),
  ]);
  return {
    createRepo  : tangTruyCap.createRepo as unknown as PhuThuocSinhAnh['createRepo'],
    chayNhiemVu : boChayMoHinh.chayNhiemVu as unknown as PhuThuocSinhAnh['chayNhiemVu'],
  };
}

function donId(id: string): string | null {
  if (typeof id !== 'string' || id.trim() === '') return null;
  return id.trim();
}

function donAnh(ketQua: Record<string, unknown> | null, workspaceId: string): AnhDaSinh | null {
  if (
    typeof ketQua?.assetId !== 'string'
    || typeof ketQua.duongDan !== 'string'
    || ketQua.tiLe !== '1:1'
  ) return null;

  const cacDoan = ketQua.duongDan.split('/');
  if (cacDoan[0] !== workspaceId || cacDoan.some((doan) => doan === '' || doan === '..')) return null;
  return {
    assetId  : ketQua.assetId,
    duongDan : ketQua.duongDan,
    tiLe     : ketQua.tiLe,
  };
}

export function taoDichVuSinhAnh(phuThuocCoDinh?: PhuThuocSinhAnh) {
  return async (thamSo: {
    workspaceId : string;
    contentId   : string;
  }): Promise<KetQuaStudio<KetQuaXep>> => {
    const contentId = donId(thamSo.contentId);
    if (!contentId) return ketQuaLoi('Bài đăng không hợp lệ.');

    try {
      const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
      const bai      = await phuThuoc.createRepo(thamSo.workspaceId).contents.layTheoId(contentId);
      if (!bai) return ketQuaLoi('Không tìm thấy bài đăng trong không gian làm việc này.');

      const viec = await phuThuoc.chayNhiemVu({
        nhiemVu          : 'sinh-anh',
        duLieuVao        : { contentId, tiLe: '1:1' },
        moHinh           : 'api',
        khongGianLamViec : thamSo.workspaceId,
        cho               : false,
      });
      return { ok: true, duLieu: viec, canhBao: [] };
    } catch {
      return ketQuaLoi('Không thể xếp việc tạo ảnh. Hãy thử lại.');
    }
  };
}

export function taoDichVuDocAnh(phuThuocCoDinh?: PhuThuocSinhAnh) {
  return async (thamSo: {
    workspaceId : string;
    jobId       : string;
  }): Promise<KetQuaStudio<TrangThaiSinhAnh>> => {
    const jobId = donId(thamSo.jobId);
    if (!jobId) return ketQuaLoi('Việc tạo ảnh không hợp lệ.');

    try {
      const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
      const job      = await phuThuoc.createRepo(thamSo.workspaceId).jobs.layTheoId(jobId);
      if (!job) return ketQuaLoi('Không tìm thấy việc tạo ảnh trong không gian làm việc này.');

      const anh = job.trangThai === 'xong' ? donAnh(job.ketQua, thamSo.workspaceId) : null;
      if (job.trangThai === 'xong' && !anh) return ketQuaLoi('Kết quả tạo ảnh không hợp lệ.');
      const loi = job.trangThai === 'loi' || job.trangThai === 'huy'
        ? 'Không thể tạo ảnh cho bài này.'
        : null;
      return { ok: true, duLieu: { trangThai: job.trangThai, anh, loi }, canhBao: [] };
    } catch {
      return ketQuaLoi('Không thể đọc trạng thái tạo ảnh. Hãy thử lại.');
    }
  };
}

export const sinhAnh = taoDichVuSinhAnh();
export const docAnh  = taoDichVuDocAnh();
