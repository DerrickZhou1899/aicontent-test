import type { KetQuaStudio } from './kieu';

export type ThamSoSinhBai = {
  workspaceId : string;
  ideaId      : string;
};

export type BanNhapBai = {
  tieuDe  : string;
  noiDung : string;
  hashtag : string[];
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
type RepoSinhBai = {
  yTuong   : { layChiTietTheoId : (id: string) => Promise<YTuongNguon | null> };
  hoSo     : { lay : () => Promise<Dong | null> };
  truCot   : { layTheoId : (id: string) => Promise<Dong | null> };
  chanDung : { layTheoId : (id: string) => Promise<Dong | null> };
  sanPham  : { layTheoId : (id: string) => Promise<Dong | null> };
  insight  : { list : (gioiHan?: number) => Promise<Dong[]> };
};
type KetQuaMay = {
  trangThai : string;
  ketQua    : Dong | null;
  loi       : string | null;
};
export type PhuThuocSinhBai = {
  createRepo  : (workspaceId: string) => RepoSinhBai;
  chayNhiemVu : (thamSo: Record<string, unknown>) => Promise<KetQuaMay>;
};

function chuoiSach(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}

function chonTruong(dong: Dong | null, tenTruong: string[]): Dong | null {
  if (dong === null) return null;
  return Object.fromEntries(tenTruong.map((ten) => [ten, dong[ten] ?? null]));
}

export function donKetQuaSinhBai(tho: unknown): BanNhapBai | null {
  if (!tho || typeof tho !== 'object' || Array.isArray(tho)) return null;
  const dong     = tho as Dong;
  const tieuDe   = chuoiSach(dong.tieuDe);
  const noiDung  = chuoiSach(dong.noiDung);
  const hashtag  = Array.isArray(dong.hashtag)
    ? [...new Set(dong.hashtag.flatMap((muc) => {
      const sach = chuoiSach(muc);
      return sach === null ? [] : [sach];
    }))]
    : [];
  return tieuDe && noiDung ? { tieuDe, noiDung, hashtag } : null;
}

export function dungDuLieuVaoSinhBai(
  yTuong   : YTuongNguon,
  hoSo     : Dong,
  truCot   : Dong | null,
  chanDung : Dong | null,
  sanPham  : Dong | null,
  insight  : Dong[],
): Record<string, unknown> {
  // Dựng lại từng nhóm để khóa nội bộ và dữ liệu nguồn không lọt vào lời nhắc.
  return {
    bienThe : yTuong.beMat,
    yTuong  : {
      tieuDe     : yTuong.tieuDe,
      gocTiepCan : yTuong.gocTiepCan,
      cauMoDau   : yTuong.cauMoDau,
      lyDoDeXuat : yTuong.lyDoDeXuat,
      beMat      : yTuong.beMat,
    },
    hoSo     : chonTruong(hoSo, ['moTa', 'giongDieu', 'dieuCamKy']),
    truCot   : chonTruong(truCot, ['ten', 'mucDich']),
    chanDung : chonTruong(chanDung, [
      'ten', 'doTuoi', 'ngheNghiep', 'noiDau', 'mongMuon', 'cauNoiThuongDung',
    ]),
    sanPham : chonTruong(sanPham, [
      'ten', 'gia', 'loiIch', 'phanDoiThuongGap', 'loiKeuGoi',
    ]),
    insight : insight.map((muc) => chonTruong(muc, ['noiDung'])),
  };
}

async function phuThuocMacDinh(): Promise<PhuThuocSinhBai> {
  const [tangTruyCap, boChayMoHinh] = await Promise.all([
    import('@/lib/data-access'),
    import('@/lib/model-runner'),
  ]);
  return {
    createRepo  : tangTruyCap.createRepo as unknown as PhuThuocSinhBai['createRepo'],
    chayNhiemVu : boChayMoHinh.chayNhiemVu as unknown as PhuThuocSinhBai['chayNhiemVu'],
  };
}

function ketQuaLoi(loi: string): KetQuaStudio<BanNhapBai> {
  return { ok: false, loi, canhBao: [] };
}

export function taoDichVuSinhBai(phuThuocCoDinh?: PhuThuocSinhBai) {
  return async (thamSo: ThamSoSinhBai): Promise<KetQuaStudio<BanNhapBai>> => {
    const phuThuoc = phuThuocCoDinh ?? await phuThuocMacDinh();
    const repo     = phuThuoc.createRepo(thamSo.workspaceId);
    const [yTuong, hoSo] = await Promise.all([
      repo.yTuong.layChiTietTheoId(thamSo.ideaId),
      repo.hoSo.lay(),
    ]);
    if (!yTuong) return ketQuaLoi('Không tìm thấy ý tưởng trong không gian làm việc này.');
    if (!hoSo) return ketQuaLoi('Hồ sơ thương hiệu chưa sẵn sàng để tạo bài.');

    const [truCot, chanDung, sanPham, insight] = await Promise.all([
      yTuong.pillarId ? repo.truCot.layTheoId(yTuong.pillarId) : null,
      yTuong.personaId ? repo.chanDung.layTheoId(yTuong.personaId) : null,
      yTuong.productId ? repo.sanPham.layTheoId(yTuong.productId) : null,
      repo.insight.list(50),
    ]);
    let ketQuaMay: KetQuaMay;
    try {
      ketQuaMay = await phuThuoc.chayNhiemVu({
        nhiemVu          : 'viet-bai',
        duLieuVao        : dungDuLieuVaoSinhBai(yTuong, hoSo, truCot, chanDung, sanPham, insight),
        moHinh           : 'auto',
        khongGianLamViec : thamSo.workspaceId,
      });
    } catch {
      return ketQuaLoi('Không thể gửi việc tạo bài. Hãy thử lại sau ít phút.');
    }
    if (ketQuaMay.trangThai !== 'xong' || !ketQuaMay.ketQua) {
      return ketQuaLoi(ketQuaMay.loi ?? 'Việc tạo bài chưa hoàn tất. Hãy thử lại.');
    }
    const banNhap = donKetQuaSinhBai(ketQuaMay.ketQua);
    return banNhap
      ? { ok: true, duLieu: banNhap, canhBao: [] }
      : ketQuaLoi('Kết quả tạo bài không hợp lệ. Hãy thử lại.');
  };
}

const dichVuMacDinh = taoDichVuSinhBai();

export async function sinhBaiTuYTuong(
  thamSo: ThamSoSinhBai,
): Promise<KetQuaStudio<BanNhapBai>> {
  return dichVuMacDinh(thamSo);
}
