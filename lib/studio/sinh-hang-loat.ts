import { createHash } from 'node:crypto';

import { dungDuLieuVaoSinhBai } from './sinh-bai';
import type { KetQuaStudio } from './kieu';

export const SO_BAI_TOI_DA = 10;

export type ThamSoSinhHangLoat = {
  workspaceId : string;
  ideaIds     : string[];
};

export type ViecSinhBai = {
  ideaId    : string;
  jobId     : string;
  trangThai : string;
};

type Dong = Record<string, unknown>;
type YTuongNguon = Dong & {
  beMat      : string;
  tieuDe     : string;
  gocTiepCan : string | null;
  cauMoDau   : string | null;
  lyDoDeXuat : string | null;
  pillarId   : string | null;
  personaId  : string | null;
  productId  : string | null;
};
type RepoSinhHangLoat = {
  yTuong   : { layChiTietTheoId : (id: string) => Promise<YTuongNguon | null> };
  hoSo     : { lay : () => Promise<Dong | null> };
  truCot   : { layTheoId : (id: string) => Promise<Dong | null> };
  chanDung : { layTheoId : (id: string) => Promise<Dong | null> };
  sanPham  : { layTheoId : (id: string) => Promise<Dong | null> };
  insight  : { list : (gioiHan?: number) => Promise<Dong[]> };
};
type KetQuaXep = {
  jobId     : string;
  trangThai : string;
};
export type PhuThuocSinhHangLoat = {
  createRepo  : (workspaceId: string) => RepoSinhHangLoat;
  chayNhiemVu : (thamSo: Record<string, unknown>) => Promise<KetQuaXep>;
};

function ketQuaLoi(loi: string): KetQuaStudio<ViecSinhBai[]> {
  return { ok: false, loi, canhBao: [] };
}

async function phuThuocMacDinh(): Promise<PhuThuocSinhHangLoat> {
  const [tangTruyCap, boChayMoHinh] = await Promise.all([
    import('@/lib/data-access'),
    import('@/lib/model-runner'),
  ]);
  return {
    createRepo  : tangTruyCap.createRepo as unknown as PhuThuocSinhHangLoat['createRepo'],
    chayNhiemVu : boChayMoHinh.chayNhiemVu as unknown as PhuThuocSinhHangLoat['chayNhiemVu'],
  };
}

function donIdeaIds(ideaIds: string[]): string[] | null {
  if (!Array.isArray(ideaIds) || ideaIds.length === 0 || ideaIds.length > SO_BAI_TOI_DA) return null;
  if (ideaIds.some((id) => typeof id !== 'string' || id.trim() === '')) return null;
  const sach = ideaIds.map((id) => id.trim());
  return new Set(sach).size === sach.length ? sach : null;
}

function khoaViec(workspaceId: string, ideaId: string, duLieuVao: Record<string, unknown>): string {
  const chuoi = JSON.stringify([workspaceId, ideaId, duLieuVao]);
  return `viet-bai:${createHash('sha256').update(chuoi).digest('hex').slice(0, 32)}`;
}

export function taoDichVuSinhHangLoat(phuThuocCoDinh?: PhuThuocSinhHangLoat) {
  return async (thamSo: ThamSoSinhHangLoat): Promise<KetQuaStudio<ViecSinhBai[]>> => {
    const ideaIds = donIdeaIds(thamSo.ideaIds);
    if (!ideaIds) return ketQuaLoi('Hãy chọn từ 1 đến 10 ý tưởng khác nhau.');

    let phuThuoc : PhuThuocSinhHangLoat;
    let repo     : RepoSinhHangLoat;
    let hoSo     : Dong | null;
    let insight  : Dong[];
    let yTuong   : (YTuongNguon | null)[];
    try {
      phuThuoc              = phuThuocCoDinh ?? await phuThuocMacDinh();
      repo                  = phuThuoc.createRepo(thamSo.workspaceId);
      [hoSo, insight, yTuong] = await Promise.all([
        repo.hoSo.lay(), repo.insight.list(50),
        Promise.all(ideaIds.map((id) => repo.yTuong.layChiTietTheoId(id))),
      ]);
    } catch {
      return ketQuaLoi('Không thể đọc dữ liệu để tạo hàng loạt. Hãy thử lại.');
    }
    if (!hoSo) return ketQuaLoi('Hồ sơ thương hiệu chưa sẵn sàng để tạo bài.');
    if (yTuong.some((muc) => muc === null)) {
      return ketQuaLoi('Có ý tưởng không thuộc không gian làm việc này.');
    }

    // Đọc đủ nguồn trước khi xếp job để lỗi dữ liệu không tạo ra một lô dang dở.
    let duLieuVao : Record<string, unknown>[];
    try {
      duLieuVao = await Promise.all((yTuong as YTuongNguon[]).map(async (muc) => {
        const [truCot, chanDung, sanPham] = await Promise.all([
          muc.pillarId ? repo.truCot.layTheoId(muc.pillarId) : null,
          muc.personaId ? repo.chanDung.layTheoId(muc.personaId) : null,
          muc.productId ? repo.sanPham.layTheoId(muc.productId) : null,
        ]);
        return dungDuLieuVaoSinhBai(muc, hoSo, truCot, chanDung, sanPham, insight);
      }));
    } catch {
      return ketQuaLoi('Không thể đọc dữ liệu để tạo hàng loạt. Hãy thử lại.');
    }

    const ketQuaXep = await Promise.allSettled(duLieuVao.map((duLieu, viTri) => phuThuoc.chayNhiemVu({
      nhiemVu          : 'viet-bai',
      duLieuVao        : duLieu,
      moHinh           : 'auto',
      khongGianLamViec : thamSo.workspaceId,
      cho               : false,
      khoaChongTrung    : khoaViec(thamSo.workspaceId, ideaIds[viTri], duLieu),
    })));
    const duLieu   : ViecSinhBai[] = [];
    const canhBao  : string[]      = [];
    ketQuaXep.forEach((muc, viTri) => {
      if (muc.status === 'fulfilled' && muc.value.jobId) {
        duLieu.push({ ideaId: ideaIds[viTri], jobId: muc.value.jobId, trangThai: muc.value.trangThai });
      } else {
        canhBao.push(`Không thể xếp ý tưởng ${ideaIds[viTri]}.`);
      }
    });
    return duLieu.length > 0
      ? { ok: true, duLieu, canhBao }
      : ketQuaLoi('Không thể xếp việc tạo bài. Hãy thử lại.');
  };
}

const dichVuMacDinh = taoDichVuSinhHangLoat();

export async function sinhHangLoat(
  thamSo: ThamSoSinhHangLoat,
): Promise<KetQuaStudio<ViecSinhBai[]>> {
  return dichVuMacDinh(thamSo);
}
