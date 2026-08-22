import type { KetQuaStudio } from './kieu';
import type { BanNhapBai } from './sinh-bai';

type YTuongDeLuu = {
  beMat       : 'fanpage' | 'ho_so_ca_nhan' | 'tiktok' | 'zalo';
  pillarId    : string | null;
  personaId   : string | null;
  productId   : string | null;
  gocTiepCan  : string | null;
  nguonYTuong : 'may-de-xuat' | 'xu-huong' | 'nguoi-tu-nhap';
  daDung       : boolean;
};

type RepoLuuBai = {
  yTuong : {
    layChiTietTheoId : (id: string) => Promise<YTuongDeLuu | null>;
    nhanQuyenSuDung   : (id: string, tieuDe: string) => Promise<YTuongDeLuu | null>;
  };
  contents : {
    tao : (giaTri: Record<string, unknown>) => Promise<{ id: string }>;
  };
};

export type ThamSoLuuBai = {
  workspaceId : string;
  ideaId      : string;
  nguoiTao    : string;
  banNhap     : BanNhapBai;
};

export type PhuThuocLuuBai = {
  trongGiaoDich : <T>(
    workspaceId : string,
    viec        : (repo: RepoLuuBai) => Promise<T>,
  ) => Promise<T>;
};

function ketQuaLoi(loi: string): KetQuaStudio<{ contentId: string }> {
  return { ok: false, loi, canhBao: [] };
}

function donHashtag(hashtag: string[]): string[] {
  return [...new Set(hashtag.flatMap((muc) => {
    const sach = muc.trim().replace(/^#+/, '').replace(/\s+/g, '');
    return sach === '' ? [] : [`#${sach}`];
  }))];
}

function ghepNoiDung(noiDung: string, hashtag: string[]): string {
  const thanBai = noiDung.trim();
  const duoiBai = donHashtag(hashtag).join(' ');
  return duoiBai === '' ? thanBai : `${thanBai}\n\n${duoiBai}`;
}

async function phuThuocMacDinh(): Promise<PhuThuocLuuBai> {
  const tangTruyCap = await import('@/lib/data-access');
  return {
    trongGiaoDich : tangTruyCap.trongGiaoDich as unknown as PhuThuocLuuBai['trongGiaoDich'],
  };
}

export function taoDichVuLuuBai(phuThuocCoDinh?: PhuThuocLuuBai) {
  return async (
    thamSo: ThamSoLuuBai,
  ): Promise<KetQuaStudio<{ contentId: string }>> => {
    const tieuDe  = thamSo.banNhap.tieuDe.trim();
    const noiDung = thamSo.banNhap.noiDung.trim();
    if (tieuDe === '' || noiDung === '') {
      return ketQuaLoi('Tiêu đề và nội dung không được để trống.');
    }

    const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
    try {
      const contentId = await phuThuoc.trongGiaoDich(thamSo.workspaceId, async (repo) => {
        const yTuong = await repo.yTuong.layChiTietTheoId(thamSo.ideaId);
        if (!yTuong) return { loi: 'khong-tim-thay' } as const;
        const daNhan = await repo.yTuong.nhanQuyenSuDung(thamSo.ideaId, tieuDe);
        if (!daNhan) return { loi: 'da-duoc-luu' } as const;

        const bai = await repo.contents.tao({
          ideaId      : thamSo.ideaId,
          beMat       : daNhan.beMat,
          pillarId    : daNhan.pillarId,
          personaId   : daNhan.personaId,
          productId   : daNhan.productId,
          gocTiepCan  : daNhan.gocTiepCan,
          nguonYTuong : daNhan.nguonYTuong,
          cauMoDau    : noiDung.split(/\r?\n/).find((dong) => dong.trim() !== '')?.trim() ?? null,
          noiDung     : ghepNoiDung(noiDung, thamSo.banNhap.hashtag),
          trangThai   : 'ban_nhap',
          nguoiTao    : thamSo.nguoiTao,
        });
        return { contentId: bai.id };
      });

      if ('loi' in contentId) {
        return contentId.loi === 'da-duoc-luu'
          ? ketQuaLoi('Ý tưởng này đã được lưu thành bản nháp.')
          : ketQuaLoi('Không tìm thấy ý tưởng trong không gian làm việc này.');
      }
      return { ok: true, duLieu: contentId, canhBao: [] };
    } catch {
      return ketQuaLoi('Không thể lưu bản nháp. Hãy thử lại.');
    }
  };
}

const dichVuMacDinh = taoDichVuLuuBai();

export async function luuBanNhapBai(
  thamSo: ThamSoLuuBai,
): Promise<KetQuaStudio<{ contentId: string }>> {
  return dichVuMacDinh(thamSo);
}
