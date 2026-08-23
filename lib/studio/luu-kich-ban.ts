import type { KetQuaStudio } from './kieu';
import type { BanNhapKichBan, PhanCanhKichBan } from './sinh-kich-ban';

type YTuongDeLuu = {
  beMat       : 'fanpage' | 'ho_so_ca_nhan' | 'tiktok' | 'zalo';
  pillarId    : string | null;
  personaId   : string | null;
  productId   : string | null;
  gocTiepCan  : string | null;
  nguonYTuong : 'may-de-xuat' | 'xu-huong' | 'nguoi-tu-nhap';
};

type RepoLuuKichBan = {
  yTuong : {
    layChiTietTheoId : (id: string) => Promise<YTuongDeLuu | null>;
  };
  contents : {
    tao : (giaTri: Record<string, unknown>) => Promise<{ id: string }>;
  };
};

export type ThamSoLuuKichBan = {
  workspaceId : string;
  ideaId      : string;
  nguoiTao    : string;
  kichBan     : BanNhapKichBan;
};

export type PhuThuocLuuKichBan = {
  createRepo : (workspaceId: string) => RepoLuuKichBan;
};

function ketQuaLoi(loi: string): KetQuaStudio<{ contentId: string }> {
  return { ok: false, loi, canhBao: [] };
}

function donCanh(canh: PhanCanhKichBan): PhanCanhKichBan | null {
  const hinhAnh  = typeof canh.hinhAnh === 'string' ? canh.hinhAnh.trim() : '';
  const loiThoai = typeof canh.loiThoai === 'string' ? canh.loiThoai.trim() : '';
  if (!Number.isFinite(canh.thoiLuongGiay) || canh.thoiLuongGiay <= 0 || hinhAnh === '') {
    return null;
  }
  return { thoiLuongGiay: canh.thoiLuongGiay, hinhAnh, loiThoai };
}

function ghepKichBan(tieuDe: string, phanCanh: PhanCanhKichBan[]): string {
  const tungCanh = phanCanh.map((canh, viTri) => [
    `Cảnh ${viTri + 1} · ${canh.thoiLuongGiay} giây`,
    `Khung hình: ${canh.hinhAnh}`,
    `Lời thoại: ${canh.loiThoai || 'Không có lời thoại.'}`,
  ].join('\n'));
  return [tieuDe, ...tungCanh].join('\n\n');
}

async function phuThuocMacDinh(): Promise<PhuThuocLuuKichBan> {
  const tangTruyCap = await import('@/lib/data-access');
  return {
    createRepo : tangTruyCap.createRepo as unknown as PhuThuocLuuKichBan['createRepo'],
  };
}

export function taoDichVuLuuKichBan(phuThuocCoDinh?: PhuThuocLuuKichBan) {
  return async (
    thamSo: ThamSoLuuKichBan,
  ): Promise<KetQuaStudio<{ contentId: string }>> => {
    const tieuDe   = thamSo.kichBan.tieuDe.trim();
    const phanCanh = thamSo.kichBan.phanCanh.map(donCanh);
    if (tieuDe === '' || phanCanh.length === 0) {
      return ketQuaLoi('Tiêu đề và phân cảnh không được để trống.');
    }
    if (phanCanh.some((canh) => canh === null)) {
      return ketQuaLoi('Mỗi cảnh cần có thời lượng và khung hình hợp lệ.');
    }

    try {
      const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
      const repo     = phuThuoc.createRepo(thamSo.workspaceId);
      const yTuong   = await repo.yTuong.layChiTietTheoId(thamSo.ideaId);
      if (!yTuong) return ketQuaLoi('Không tìm thấy ý tưởng trong không gian làm việc này.');

      const canhSach = phanCanh as PhanCanhKichBan[];
      const bai       = await repo.contents.tao({
        ideaId      : thamSo.ideaId,
        beMat       : yTuong.beMat,
        pillarId    : yTuong.pillarId,
        personaId   : yTuong.personaId,
        productId   : yTuong.productId,
        gocTiepCan  : yTuong.gocTiepCan,
        nguonYTuong : yTuong.nguonYTuong,
        cauMoDau    : canhSach.find((canh) => canh.loiThoai !== '')?.loiThoai ?? null,
        dangBai     : 'kich_ban_quay',
        noiDung     : ghepKichBan(tieuDe, canhSach),
        trangThai   : 'ban_nhap',
        nguoiTao    : thamSo.nguoiTao,
      });
      return { ok: true, duLieu: { contentId: bai.id }, canhBao: [] };
    } catch {
      return ketQuaLoi('Không thể lưu kịch bản. Hãy thử lại.');
    }
  };
}

const dichVuMacDinh = taoDichVuLuuKichBan();

export async function luuBanNhapKichBan(
  thamSo: ThamSoLuuKichBan,
): Promise<KetQuaStudio<{ contentId: string }>> {
  return dichVuMacDinh(thamSo);
}
