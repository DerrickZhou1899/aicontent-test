import type { NguoiDungTuPhien } from '@/lib/data-access';

import { dungDuLieuDeXuat, type ThamKhaoAnToan } from './du-lieu-de-xuat';
import type { BeMat, KetQuaStudio, YTuongDeXuat } from './kieu';
import { donYTuongTheoSlot, khoa, khoaChongTrungDeXuat, raiTheoTruCot, taoSlotDeXuat, type ThamSoDeXuat } from './de-xuat-thuan';

type TruCot = { id : string; ten : string; tiLeMucTieu : unknown };
type ChanDung = { id : string; ten : string; noiDau : string | null };
type TinHieu = { id : string; congThuc : unknown };
type RepoDeXuat = {
  hoSo           : { lay : () => Promise<{ giongDieu : string | null; dieuCamKy : string | null } | null> };
  truCot         : { list : () => Promise<TruCot[]> };
  chanDung       : { list : () => Promise<ChanDung[]> };
  insight        : { list : () => Promise<{ noiDung : string }[]> };
  contents       : { list : (loc: { beMat : BeMat; trangThai : 'da_dang'; gioiHan : number }) => Promise<{ gocTiepCan : string | null; cauMoDau : string | null }[]> };
  tinHieuXuHuong : { theoNguoiDung : (nguoiDung: NguoiDungTuPhien, gioiHan: number) => Promise<TinHieu[]>; danhDauDaDung : (ids: string[]) => Promise<void> };
  jobs           : { nhanQuyenLuuYTuong : (jobId: string) => Promise<boolean> };
  yTuong         : { tao : (muc: Record<string, unknown>) => Promise<unknown> };
};

type KetQuaChay = {
  jobId     : string;
  trangThai : string;
  ketQua    : Record<string, unknown> | null;
  loi       : string | null;
};
export type PhuThuocDeXuat = {
  createRepo    : (workspaceId: string) => RepoDeXuat;
  trongGiaoDich : <T>(workspaceId: string, viec: (repo: RepoDeXuat) => Promise<T>) => Promise<T>;
  chayNhiemVu   : (thamSo: Record<string, unknown>) => Promise<KetQuaChay>;
  daBocXong     : (congThuc: unknown) => boolean;
};

const BE_MAT_HOP_LE: BeMat[] = ['fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo'];

function ketQuaLoi(loi: string): KetQuaStudio<YTuongDeXuat[]> {
  return { ok: false, loi, canhBao: [] };
}
function tiLeSo(giaTri: unknown): number | null {
  if (giaTri === null || giaTri === undefined) return null;
  const so = typeof giaTri === 'number' ? giaTri : Number(giaTri);
  return Number.isFinite(so) ? so : null;
}
function chuoiSach(giaTri: unknown): string | null {
  return typeof giaTri === 'string' && giaTri.trim() !== '' ? giaTri.trim() : null;
}
function thamKhaoTuTinHieu(tinHieu: TinHieu[], daBocXong: PhuThuocDeXuat['daBocXong']): ThamKhaoAnToan[] {
  return tinHieu.flatMap((muc): ThamKhaoAnToan[] => {
    if (!daBocXong(muc.congThuc)) return [];
    const congThuc = muc.congThuc as Record<string, unknown>;
    return [{
      trendSignalId : muc.id,
      kieuHook      : chuoiSach(congThuc.kieuHook),
      chuDe         : Array.isArray(congThuc.chuDe)
        ? congThuc.chuDe.flatMap((chuDe) => {
          const sach = chuoiSach(chuDe);
          return sach === null ? [] : [sach];
        })
        : [],
      soChu : typeof congThuc.soChu === 'number' && Number.isFinite(congThuc.soChu)
        ? Math.max(0, Math.floor(congThuc.soChu))
        : 0,
      coCTA : congThuc.coCTA === true,
    }];
  });
}

async function phuThuocMacDinh(): Promise<PhuThuocDeXuat> {
  const [tangTruyCap, boChayMoHinh, bocCongThuc] = await Promise.all([import('@/lib/data-access'), import('@/lib/model-runner'), import('./boc-cong-thuc')]);
  return {
    createRepo    : tangTruyCap.createRepo as unknown as PhuThuocDeXuat['createRepo'],
    trongGiaoDich : tangTruyCap.trongGiaoDich as unknown as PhuThuocDeXuat['trongGiaoDich'],
    chayNhiemVu   : boChayMoHinh.chayNhiemVu as unknown as PhuThuocDeXuat['chayNhiemVu'],
    daBocXong     : bocCongThuc.daBocXong,
  };
}

export function taoDichVuDeXuat(phuThuocTuyChon?: PhuThuocDeXuat) {
  let phuThuocMacDinhDaTai: Promise<PhuThuocDeXuat> | undefined;
  const layPhuThuoc = () => phuThuocTuyChon ?? (phuThuocMacDinhDaTai ??= phuThuocMacDinh());
  return async function deXuat(thamSo: ThamSoDeXuat, nguoiDung: NguoiDungTuPhien | undefined = undefined): Promise<KetQuaStudio<YTuongDeXuat[]>> {
    if (typeof thamSo?.workspaceId !== 'string' || thamSo.workspaceId.trim() === '') return ketQuaLoi('Khong gian lam viec khong hop le. Hay tai lai trang va thu lai.');
    if (!BE_MAT_HOP_LE.includes(thamSo.beMat)) return ketQuaLoi('Be mat dang khong hop le. Hay chon mot be mat duoc ho tro.');
    if (!Number.isInteger(thamSo.soLuong) || thamSo.soLuong < 1 || thamSo.soLuong > 20) return ketQuaLoi('So luong y tuong phai la so nguyen tu 1 den 20.');
    const phuThuoc = await layPhuThuoc();
    const repo     = phuThuoc.createRepo(thamSo.workspaceId);
    const [hoSo, truCot, chanDung, insight, lichSuKenhMinh] = await Promise.all([
      repo.hoSo.lay(),
      repo.truCot.list(),
      repo.chanDung.list(),
      repo.insight.list(),
      repo.contents.list({ beMat: thamSo.beMat, trangThai: 'da_dang', gioiHan: 30 }),
    ]);
    if (truCot.length === 0) return ketQuaLoi('Can it nhat mot tru cot noi dung that truoc khi de xuat y tuong.');
    if (chanDung.length === 0) return ketQuaLoi('Can it nhat mot chan dung khach hang that truoc khi de xuat y tuong.');
    const tinHieu      = nguoiDung === undefined ? [] : await repo.tinHieuXuHuong.theoNguoiDung(nguoiDung, 40);
    const slot         = taoSlotDeXuat(thamSo.soLuong, thamKhaoTuTinHieu(tinHieu, phuThuoc.daBocXong));
    const duLieuAnToan = dungDuLieuDeXuat({
      hoSo : {
        giongDieu : hoSo?.giongDieu ?? null,
        dieuCamKy : hoSo?.dieuCamKy ?? null,
      },
      truCot   : truCot.map((muc) => ({ ten: muc.ten, tiLeMucTieu: tiLeSo(muc.tiLeMucTieu) })),
      chanDung : chanDung.map((muc) => ({ ten: muc.ten, noiDau: muc.noiDau })),
      insight  : insight.map((muc) => ({ noiDung: muc.noiDung })),
      lichSuKenhMinh,
      beMat   : thamSo.beMat,
      soLuong : thamSo.soLuong,
      slot,
    }) as Record<string, unknown>;
    let ketQuaChay: KetQuaChay;
    try {
      ketQuaChay = await phuThuoc.chayNhiemVu({
        nhiemVu          : 'de-xuat-y-tuong',
        duLieuVao        : duLieuAnToan,
        moHinh           : 'auto',
        khongGianLamViec : thamSo.workspaceId,
        khoaChongTrung   : khoaChongTrungDeXuat(thamSo.workspaceId, thamSo.beMat, duLieuAnToan),
      });
    } catch { return ketQuaLoi('Khong the gui viec de xuat y tuong. Hay thu lai sau it phut.'); }
    if (ketQuaChay.trangThai !== 'xong' || !ketQuaChay.ketQua) return ketQuaLoi(ketQuaChay.loi ?? 'De xuat y tuong khong hoan tat. Hay thu lai.');
    const yTuongDaDon     = donYTuongTheoSlot(ketQuaChay.ketQua, slot, truCot.map((muc) => muc.ten), chanDung.map((muc) => muc.ten), thamSo.beMat);
    const daChon          = raiTheoTruCot(yTuongDaDon, truCot.map((muc) => ({ ten: muc.ten, tiLeMucTieu: tiLeSo(muc.tiLeMucTieu) })), thamSo.soLuong);
    const idTruCot        = new Map(truCot.map((muc) => [khoa(muc.ten), muc.id]));
    const idChanDung      = new Map(chanDung.map((muc) => [khoa(muc.ten), muc.id]));
    const idTinHieuDaDung = [...new Set(daChon.flatMap((muc) => muc.trendSignalId === null ? [] : [muc.trendSignalId]))];
    try {
      await phuThuoc.trongGiaoDich(thamSo.workspaceId, async (giaoDich) => {
        // Marker và các insert phải cùng giao dịch để lỗi lưu vẫn cho phép thử lại.
        if (!await giaoDich.jobs.nhanQuyenLuuYTuong(ketQuaChay.jobId)) return;
        for (const muc of daChon) {
          await giaoDich.yTuong.tao({
            beMat         : thamSo.beMat,
            tieuDe        : muc.tieuDe,
            gocTiepCan    : muc.gocTiepCan,
            cauMoDau      : muc.cauMoDau,
            lyDoDeXuat    : muc.lyDoDeXuat,
            pillarId      : muc.truCot === null ? null : idTruCot.get(khoa(muc.truCot)) ?? null,
            personaId     : muc.chanDung === null ? null : idChanDung.get(khoa(muc.chanDung)) ?? null,
            nguonYTuong   : muc.trendSignalId === null ? 'may-de-xuat' : 'xu-huong',
            trendSignalId : muc.trendSignalId,
          });
        }
        await giaoDich.tinHieuXuHuong.danhDauDaDung(idTinHieuDaDung);
      });
    } catch { return ketQuaLoi('Khong the luu cac y tuong vua de xuat. Khong co y tuong nao duoc luu; hay thu lai.'); }
    const canhBao = daChon.length < thamSo.soLuong ? [`Chi co ${daChon.length}/${thamSo.soLuong} y tuong hop le sau khi kiem tra ket qua mo hinh.`] : [];
    return { ok: true, duLieu: daChon.map(({ trendSignalId: _bo, ...muc }) => muc), canhBao };
  };
}
