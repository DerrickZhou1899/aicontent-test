import type { KetQuaStudio } from './kieu';
import type { BanNhapBai } from './sinh-bai';

export type BaiCanLuu = {
  ideaId  : string;
  banNhap : BanNhapBai;
};

type YTuongDeLuu = {
  beMat       : 'fanpage' | 'ho_so_ca_nhan' | 'tiktok' | 'zalo';
  pillarId    : string | null;
  personaId   : string | null;
  productId   : string | null;
  gocTiepCan  : string | null;
  nguonYTuong : 'may-de-xuat' | 'xu-huong' | 'nguoi-tu-nhap';
};

type RepoLuuHangLoat = {
  yTuong : {
    layChiTietTheoId : (id: string) => Promise<YTuongDeLuu | null>;
    nhanQuyenSuDung   : (id: string, tieuDe: string) => Promise<YTuongDeLuu | null>;
  };
  contents : {
    tao : (giaTri: Record<string, unknown>) => Promise<{ id: string }>;
  };
};

export type ThamSoLuuHangLoat = {
  workspaceId : string;
  nguoiTao    : string;
  bai         : BaiCanLuu[];
};

export type PhuThuocLuuHangLoat = {
  trongGiaoDich : <T>(
    workspaceId : string,
    viec        : (repo: RepoLuuHangLoat) => Promise<T>,
  ) => Promise<T>;
};

function ketQuaLoi(loi: string): KetQuaStudio<{ soBai: number; contentIds: string[] }> {
  return { ok: false, loi, canhBao: [] };
}

function donBai(bai: BaiCanLuu[]): BaiCanLuu[] | null {
  if (!Array.isArray(bai) || bai.length === 0 || bai.length > 10) return null;
  if (bai.some((muc) => (
    typeof muc?.ideaId !== 'string'
    || typeof muc.banNhap?.tieuDe !== 'string'
    || typeof muc.banNhap?.noiDung !== 'string'
    || !Array.isArray(muc.banNhap?.hashtag)
    || muc.banNhap.hashtag.some((the) => typeof the !== 'string')
  ))) return null;
  const sach = bai.map((muc) => ({
    ideaId  : muc.ideaId.trim(),
    banNhap : {
      tieuDe  : muc.banNhap.tieuDe.trim(),
      noiDung : muc.banNhap.noiDung.trim(),
      hashtag : muc.banNhap.hashtag,
    },
  }));
  if (sach.some((muc) => muc.ideaId === '' || muc.banNhap.tieuDe === '' || muc.banNhap.noiDung === '')) return null;
  return new Set(sach.map((muc) => muc.ideaId)).size === sach.length ? sach : null;
}

function ghepNoiDung(noiDung: string, hashtag: string[]): string {
  const the = [...new Set(hashtag.flatMap((muc) => {
    const sach = muc.trim().replace(/^#+/, '').replace(/\s+/g, '');
    return sach === '' ? [] : [`#${sach}`];
  }))].join(' ');
  return the === '' ? noiDung : `${noiDung}\n\n${the}`;
}

async function phuThuocMacDinh(): Promise<PhuThuocLuuHangLoat> {
  const tangTruyCap = await import('@/lib/data-access');
  return {
    trongGiaoDich : tangTruyCap.trongGiaoDich as unknown as PhuThuocLuuHangLoat['trongGiaoDich'],
  };
}

export function taoDichVuLuuHangLoat(phuThuocCoDinh?: PhuThuocLuuHangLoat) {
  return async (thamSo: ThamSoLuuHangLoat): Promise<KetQuaStudio<{ soBai: number; contentIds: string[] }>> => {
    const bai = donBai(thamSo.bai);
    if (!bai) return ketQuaLoi('Danh sách bản nháp không hợp lệ.');

    const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
    try {
      const contentIds = await phuThuoc.trongGiaoDich(thamSo.workspaceId, async (repo) => {
        const yTuong = await Promise.all(bai.map((muc) => repo.yTuong.layChiTietTheoId(muc.ideaId)));
        if (yTuong.some((muc) => !muc)) throw new Error('y-tuong-khong-hop-le');

        const ids: string[] = [];
        for (const muc of bai) {
          const daNhan = await repo.yTuong.nhanQuyenSuDung(muc.ideaId, muc.banNhap.tieuDe);
          if (!daNhan) throw new Error('y-tuong-da-dung');
          const noiDung = ghepNoiDung(muc.banNhap.noiDung, muc.banNhap.hashtag);
          const daLuu = await repo.contents.tao({
            ideaId      : muc.ideaId,
            beMat       : daNhan.beMat,
            pillarId    : daNhan.pillarId,
            personaId   : daNhan.personaId,
            productId   : daNhan.productId,
            gocTiepCan  : daNhan.gocTiepCan,
            nguonYTuong : daNhan.nguonYTuong,
            cauMoDau    : noiDung.split(/\r?\n/).find((dong) => dong.trim() !== '')?.trim() ?? null,
            noiDung,
            trangThai   : 'ban_nhap',
            nguoiTao    : thamSo.nguoiTao,
          });
          ids.push(daLuu.id);
        }
        return ids;
      });
      return { ok: true, duLieu: { soBai: contentIds.length, contentIds }, canhBao: [] };
    } catch {
      return ketQuaLoi('Không thể lưu toàn bộ bản nháp. Hãy thử lại.');
    }
  };
}

const dichVuMacDinh = taoDichVuLuuHangLoat();

export async function luuHangLoat(thamSo: ThamSoLuuHangLoat) {
  return dichVuMacDinh(thamSo);
}
