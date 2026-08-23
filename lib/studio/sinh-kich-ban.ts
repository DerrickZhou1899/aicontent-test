import type { KetQuaStudio } from './kieu';

export type ThamSoSinhKichBan = {
  workspaceId              : string;
  ideaId                   : string;
  thoiLuongMucTieuGiay?    : number;
};

export type PhanCanhKichBan = {
  thoiLuongGiay : number;
  hinhAnh       : string;
  loiThoai      : string;
};

export type BanNhapKichBan = {
  tieuDe   : string;
  phanCanh : PhanCanhKichBan[];
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
type RepoSinhKichBan = {
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
export type PhuThuocSinhKichBan = {
  createRepo  : (workspaceId: string) => RepoSinhKichBan;
  chayNhiemVu : (thamSo: Record<string, unknown>) => Promise<KetQuaMay>;
};

function chuoiSach(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}

function chonTruong(dong: Dong | null, tenTruong: string[]): Dong | null {
  if (dong === null) return null;
  return Object.fromEntries(tenTruong.map((ten) => [ten, dong[ten] ?? null]));
}

function donPhanCanh(tho: unknown): PhanCanhKichBan | null {
  if (!tho || typeof tho !== 'object' || Array.isArray(tho)) return null;
  const dong          = tho as Dong;
  const thoiLuongGiay = dong.thoiLuongGiay;
  const hinhAnh       = chuoiSach(dong.hinhAnh);
  const loiThoai      = typeof dong.loiThoai === 'string' ? dong.loiThoai.trim() : null;
  if (
    typeof thoiLuongGiay !== 'number'
    || !Number.isFinite(thoiLuongGiay)
    || thoiLuongGiay <= 0
    || hinhAnh === null
    || loiThoai === null
  ) return null;
  return { thoiLuongGiay, hinhAnh, loiThoai };
}

export function donKetQuaKichBan(tho: unknown): BanNhapKichBan | null {
  if (!tho || typeof tho !== 'object' || Array.isArray(tho)) return null;
  const dong     = tho as Dong;
  const tieuDe   = chuoiSach(dong.tieuDe);
  const phanCanh = Array.isArray(dong.phanCanh)
    ? dong.phanCanh.flatMap((muc) => {
      const sach = donPhanCanh(muc);
      return sach === null ? [] : [sach];
    })
    : [];
  return tieuDe && phanCanh.length > 0 ? { tieuDe, phanCanh } : null;
}

function dungDuLieuVao(
  yTuong                 : YTuongNguon,
  hoSo                   : Dong,
  truCot                 : Dong | null,
  chanDung               : Dong | null,
  sanPham                : Dong | null,
  insight                : Dong[],
  thoiLuongMucTieuGiay?  : number,
): Record<string, unknown> {
  const thoiLuongHopLe = typeof thoiLuongMucTieuGiay === 'number'
    && Number.isFinite(thoiLuongMucTieuGiay)
    && thoiLuongMucTieuGiay > 0;
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
    ...(thoiLuongHopLe ? { thoiLuongMucTieuGiay } : {}),
  };
}

async function phuThuocMacDinh(): Promise<PhuThuocSinhKichBan> {
  const [tangTruyCap, boChayMoHinh] = await Promise.all([
    import('@/lib/data-access'),
    import('@/lib/model-runner'),
  ]);
  return {
    createRepo  : tangTruyCap.createRepo as unknown as PhuThuocSinhKichBan['createRepo'],
    chayNhiemVu : boChayMoHinh.chayNhiemVu as unknown as PhuThuocSinhKichBan['chayNhiemVu'],
  };
}

function ketQuaLoi(loi: string): KetQuaStudio<BanNhapKichBan> {
  return { ok: false, loi, canhBao: [] };
}

export function taoDichVuSinhKichBan(phuThuocCoDinh?: PhuThuocSinhKichBan) {
  return async (thamSo: ThamSoSinhKichBan): Promise<KetQuaStudio<BanNhapKichBan>> => {
    let phuThuoc : PhuThuocSinhKichBan;
    let repo     : RepoSinhKichBan;
    let yTuong   : YTuongNguon | null;
    let hoSo     : Dong | null;
    try {
      phuThuoc         = phuThuocCoDinh ?? await phuThuocMacDinh();
      repo             = phuThuoc.createRepo(thamSo.workspaceId);
      [yTuong, hoSo]   = await Promise.all([
        repo.yTuong.layChiTietTheoId(thamSo.ideaId), repo.hoSo.lay(),
      ]);
    } catch {
      return ketQuaLoi('Không thể đọc dữ liệu để tạo kịch bản. Hãy thử lại.');
    }
    if (!yTuong) return ketQuaLoi('Không tìm thấy ý tưởng trong không gian làm việc này.');
    if (!hoSo) return ketQuaLoi('Hồ sơ thương hiệu chưa sẵn sàng để tạo kịch bản.');

    let duLieuPhu : [Dong | null, Dong | null, Dong | null, Dong[]];
    try {
      duLieuPhu = await Promise.all([
        yTuong.pillarId ? repo.truCot.layTheoId(yTuong.pillarId) : null,
        yTuong.personaId ? repo.chanDung.layTheoId(yTuong.personaId) : null,
        yTuong.productId ? repo.sanPham.layTheoId(yTuong.productId) : null,
        repo.insight.list(50),
      ]);
    } catch {
      return ketQuaLoi('Không thể đọc dữ liệu để tạo kịch bản. Hãy thử lại.');
    }
    const [truCot, chanDung, sanPham, insight] = duLieuPhu;
    let ketQuaMay : KetQuaMay;
    try {
      ketQuaMay = await phuThuoc.chayNhiemVu({
        nhiemVu          : 'viet-kich-ban',
        duLieuVao        : dungDuLieuVao(
          yTuong, hoSo, truCot, chanDung, sanPham, insight, thamSo.thoiLuongMucTieuGiay,
        ),
        moHinh           : 'auto',
        khongGianLamViec : thamSo.workspaceId,
      });
    } catch {
      return ketQuaLoi('Không thể gửi việc tạo kịch bản. Hãy thử lại sau ít phút.');
    }
    if (ketQuaMay.trangThai !== 'xong' || !ketQuaMay.ketQua) {
      return ketQuaLoi(ketQuaMay.loi ?? 'Việc tạo kịch bản chưa hoàn tất. Hãy thử lại.');
    }
    const banNhap = donKetQuaKichBan(ketQuaMay.ketQua);
    return banNhap
      ? { ok: true, duLieu: banNhap, canhBao: [] }
      : ketQuaLoi('Kết quả tạo kịch bản không hợp lệ. Hãy thử lại.');
  };
}

const dichVuMacDinh = taoDichVuSinhKichBan();

export async function sinhKichBanTuYTuong(
  thamSo: ThamSoSinhKichBan,
): Promise<KetQuaStudio<BanNhapKichBan>> {
  return dichVuMacDinh(thamSo);
}
