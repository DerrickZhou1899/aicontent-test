/**
 * Dieu phoi mot luot keo: goi Apify -> bo bai da co -> ghi CSDL -> tai anh.
 *
 * VI SAO BAI KEO VE VAO THANG `contents` chu khong mot bang rieng: luoc do da
 * duoc dung san cho dung viec nay tu Phase 3 — `lien_ket_goc`, `ma_bai`,
 * `ngay_dang`, `trang_thai_theo_doi` deu la cot cua `contents`, va khoi do hieu
 * qua (Phase 15) tro khoa ngoai ghep vao `contents`. Tach bang rieng la sau nay
 * bai da dang khong do duoc.
 *
 * THU TU GHI CO Y NGHIA: ghi `contents` + `bai_keo_tho` trong MOT giao dich
 * truoc, tai anh SAU. Tai anh la viec mang, hong la chuyen thuong; hong giua
 * chung ma bai da nam trong CSDL thi nguoi dung van thay bai va van doc duoc
 * chu, chi thieu anh — con nguoc lai, tai anh xong ma ghi hong thi ta co mot
 * dong tep mo coi khong ai tro toi.
 */

import { createRepo, trongGiaoDich } from '@/lib/data-access';

import { keoHoSoCaNhan, NGUON_KEO, type BaiKeoVe } from './apify-ho-so-ca-nhan';
import { bocLaiSoLieu } from './boc-lai-so-lieu';
import { taiAnh } from './kho-anh';

export type KetQuaLuot = {
  soLayVe: number;
  soBaiMoi: number;
  soDaCo: number;
  soAnhLuu: number;
  soAnhHong: number;
  /** Anh cua luot keo TRUOC bi hong, luot nay tai lai duoc. */
  soAnhVaLai: number;
  soVideo: number;
  /** Bai co so lieu duoc boc lai va doi gia tri. */
  soSoLieuCapNhat: number;
  /** Loi khong chan luot chay — anh hong, video khong ghi duoc. */
  canhBao: string[];
};

export type KetQuaKeoVeLuu =
  | { ok: true; ket: KetQuaLuot }
  | { ok: false; loi: string };

/** Cau mo dau dat vao `cau_mo_dau`: hai dong dau la thu quyet dinh nguoi ta co doc tiep khong. */
function cauMoDau(noiDung: string): string | null {
  const dong = noiDung.split('\n').find((d) => d.trim() !== '');
  return dong ? dong.trim().slice(0, 300) : null;
}

export async function keoVaLuuHoSoCaNhan(thamSo: {
  workspaceId: string;
  kenhDangId: string;
  urlKenh: string;
  soBai: number;
}): Promise<KetQuaKeoVeLuu> {
  const { workspaceId, kenhDangId, urlKenh, soBai } = thamSo;

  const keo = await keoHoSoCaNhan({ urlKenh, soBai });
  if (!keo.ok) return { ok: false, loi: keo.loi };

  const canhBao: string[] = [];

  // Mot giao dich cho phan ghi CSDL. Bo bai da co TRONG giao dich chu khong
  // truoc do: hai luot keo bam gan nhau se cung thay "chua co" roi cung ghi.
  const daGhi = await trongGiaoDich(workspaceId, async (repo) => {
    const daCo = await repo.baiKeoTho.maBaiDaCo(keo.bai.map((b) => b.maBai));
    const moi = keo.bai.filter((b) => !daCo.has(b.maBai));
    const ghi: { bai: BaiKeoVe; contentId: string }[] = [];

    for (const bai of moi) {
      const dong = await repo.contents.tao({
        beMat: 'ho_so_ca_nhan',
        kenhDangId,
        noiDung: bai.noiDung || null,
        cauMoDau: cauMoDau(bai.noiDung),
        lienKetGoc: bai.urlBai,
        maBai: bai.maBai,
        ngayDang: bai.ngayDang,
        // Bai keo ve la bai NGUOI DUNG da dang that, khong phai may de xuat.
        nguonYTuong: 'nguoi-tu-nhap',
        trangThai: 'da_dang',
        dangBai: bai.urlVideo.length ? 'kich_ban_quay' : 'chu',
      });

      await repo.baiKeoTho.tao({
        contentId: dong.id,
        kenhDangId,
        maBai: bai.maBai,
        nguon: NGUON_KEO,
        duLieu: bai.tho as never,
        soThich: bai.soThich,
        soBinhLuan: bai.soBinhLuan,
        soChiaSe: bai.soChiaSe,
        thoiLuongVideoMs: bai.thoiLuongVideoMs,
      });

      // Video: chi ghi lien ket, KHONG tai ve. Phu de boc sau bang ElevenLabs.
      for (const url of bai.urlVideo) {
        await repo.asset.tao({ contentId: dong.id, loai: 'video', urlNgoai: url });
      }

      ghi.push({ bai, contentId: dong.id });
    }

    return { ghi, soDaCo: daCo.size };
  });

  // Tai anh NGOAI giao dich: mot giao dich mo suot ca chuc luot tai mang la giu
  // ket noi va khoa hang lau vo ich.
  let soAnhLuu = 0;
  let soAnhHong = 0;
  let soVideo = 0;

  for (const { bai, contentId } of daGhi.ghi) {
    soVideo += bai.urlVideo.length;
    for (const anh of bai.anh) {
      const tai = await taiAnh(workspaceId, anh.url);
      if (!tai.ok) {
        soAnhHong += 1;
        canhBao.push(`Ảnh trong bài ${bai.maBai}: ${tai.loi}`);
        // Van ghi dong asset voi lien ket ngoai: mat tep con hon mat ca dau vet.
      }
      await trongGiaoDich(workspaceId, (repo) =>
        repo.asset.tao({
          contentId,
          loai: 'anh',
          duongDan: tai.ok ? tai.duongDan : null,
          urlNgoai: anh.url,
          kichThuocByte: tai.ok ? tai.soByte : null,
        }),
      );
      if (tai.ok) soAnhLuu += 1;
    }
  }

  // Va anh hong cua cac luot TRUOC. Tai anh that bai vi su co mang tam thoi la
  // chuyen thuong; khong co buoc nay thi anh do mat vinh vien va cach duy nhat
  // lay lai la keo lai bai — ton tien Apify cho mot loi khong lien quan gi den
  // Apify.
  const soAnhVaLai = await vaAnhThieu(workspaceId, canhBao);

  // Chay lai bo boc tren ca kho: bai cu duoc boc bang phien ban cu cua ham se
  // duoc cap nhat theo phien ban hien tai. Doc tu ban tho da luu nen khong ton
  // them mot luot Apify nao.
  const bocLai = await bocLaiSoLieu(workspaceId);

  return {
    ok: true,
    ket: {
      soLayVe: keo.bai.length,
      soBaiMoi: daGhi.ghi.length,
      soDaCo: daGhi.soDaCo,
      soAnhLuu,
      soAnhHong,
      soAnhVaLai,
      soVideo,
      soSoLieuCapNhat: bocLai.soDoi,
      canhBao: canhBao.slice(0, 10),
    },
  };
}

/** Tai lai cac anh da ghi nhan ma chua co tep. Tra ve so anh va duoc. */
export async function vaAnhThieu(workspaceId: string, canhBao: string[] = []): Promise<number> {
  const repo = createRepo(workspaceId);
  const thieu = await repo.asset.anhChuaTai();
  let va = 0;

  for (const a of thieu) {
    if (!a.urlNgoai) continue;
    const tai = await taiAnh(workspaceId, a.urlNgoai);
    if (!tai.ok) {
      canhBao.push(`Ảnh cũ vẫn chưa tải được: ${tai.loi}`);
      continue;
    }
    await repo.asset.datDuongDan(a.id, tai.duongDan, tai.soByte);
    va += 1;
  }

  return va;
}
