import type { KetQuaStudio } from './kieu';

type NoiDungCanSua = {
  id        : string;
  trangThai : string;
};

type RepoSuaBanNhap = {
  contents : {
    layTheoId : (id: string) => Promise<NoiDungCanSua | null>;
    sua        : (
      id      : string,
      giaTri : { noiDung: string; cauMoDau: string },
    ) => Promise<unknown>;
  };
};

type PhuThuocSuaBanNhap = {
  createRepo : (workspaceId: string) => RepoSuaBanNhap;
};

type ThamSoSuaBanNhap = {
  workspaceId : string;
  contentId   : string;
  noiDung     : string;
};

function ketQuaLoi(loi: string): KetQuaStudio<{ contentId: string }> {
  return { ok: false, loi, canhBao: [] };
}

async function phuThuocMacDinh(): Promise<PhuThuocSuaBanNhap> {
  const tangTruyCap = await import('@/lib/data-access');
  return { createRepo: tangTruyCap.createRepo as unknown as PhuThuocSuaBanNhap['createRepo'] };
}

export function taoDichVuSuaBanNhap(phuThuocCoDinh?: PhuThuocSuaBanNhap) {
  return async (thamSo: ThamSoSuaBanNhap): Promise<KetQuaStudio<{ contentId: string }>> => {
    const contentId = typeof thamSo.contentId === 'string' ? thamSo.contentId.trim() : '';
    const noiDung   = typeof thamSo.noiDung === 'string' ? thamSo.noiDung.trim() : '';
    if (contentId === '' || noiDung === '') return ketQuaLoi('Nội dung bản nháp không hợp lệ.');

    const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
    const repo     = phuThuoc.createRepo(thamSo.workspaceId);
    const banNhap  = await repo.contents.layTheoId(contentId);
    if (!banNhap || banNhap.trangThai !== 'ban_nhap') {
      return ketQuaLoi('Không tìm thấy bản nháp cần sửa.');
    }

    const cauMoDau = noiDung.split(/\r?\n/).find((dong) => dong.trim() !== '')!.trim();
    await repo.contents.sua(contentId, { noiDung, cauMoDau });
    return { ok: true, duLieu: { contentId }, canhBao: [] };
  };
}

export async function suaBanNhap(thamSo: ThamSoSuaBanNhap) {
  return taoDichVuSuaBanNhap()(thamSo);
}
