'use server';

/**
 * Hanh dong may chu cho ho so thuong hieu.
 *
 * `workspaceId` LUON doc tu phien dang nhap qua `workspaceHienTai()`, khong bao
 * gio nhan tu form. Nguoi dung sua mot o an trong DevTools cung khong ghi sang
 * khong gian lam viec khac duoc — bo quet Phase 5 cuong che dieu nay, khong phai
 * quy uoc.
 */

import { revalidatePath } from 'next/cache';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { bocTachHoSo, type BanNhapHoSo } from '@/lib/brand/boc-tach';
import { layDacTa, type DacTaNhom } from '@/lib/brand/dac-ta-nhom';
import { createRepo, trongGiaoDich } from '@/lib/data-access';

export type KetQuaHanhDong = { ok: true } | { ok: false; loi: string };

/**
 * Boc gia tri tu form theo dac ta nhom. Chi lay dung cac truong da khai bao —
 * form gui them khoa la nem di, khong ghi bua vao bang.
 */
function bocTheoDacTa(dacTa: DacTaNhom, form: FormData): Record<string, unknown> {
  const giaTri: Record<string, unknown> = {};
  for (const truong of dacTa.truong) {
    if (truong.kieu === 'co') {
      giaTri[truong.khoa] = form.get(truong.khoa) !== null;
      continue;
    }
    const tho = form.get(truong.khoa);
    const chuoi = typeof tho === 'string' ? tho.trim() : '';
    // O rong ghi `null` chu khong ghi chuoi rong: `do-day-du.ts` coi chuoi rong
    // la chua dien, hai cach bieu dien cung mot y nghia la mam mong lech nhau.
    giaTri[truong.khoa] = chuoi === '' ? null : chuoi;
  }
  return giaTri;
}

function thieuTruongBatBuoc(dacTa: DacTaNhom, giaTri: Record<string, unknown>): string | null {
  for (const truong of dacTa.truong) {
    if (truong.batBuoc && !giaTri[truong.khoa]) return `Thiếu ${truong.nhan.toLowerCase()}.`;
  }
  return null;
}

/** Tra ve repo cua nhom, hoac `null` khi slug khong hop le. */
async function moNhom(slug: string) {
  const dacTa = layDacTa(slug);
  if (!dacTa) return null;
  const repo = createRepo(await workspaceHienTai());
  return { dacTa, kho: repo[dacTa.repo] };
}

export async function taoMuc(slug: string, form: FormData): Promise<KetQuaHanhDong> {
  const mo = await moNhom(slug);
  if (!mo) return { ok: false, loi: 'Nhóm không hợp lệ.' };

  const giaTri = bocTheoDacTa(mo.dacTa, form);
  const thieu = thieuTruongBatBuoc(mo.dacTa, giaTri);
  if (thieu) return { ok: false, loi: thieu };

  await mo.kho.tao(giaTri);
  revalidatePath(`/brand/${slug}`);
  revalidatePath('/brand');
  return { ok: true };
}

export async function suaMuc(
  slug: string,
  id: string,
  form: FormData,
): Promise<KetQuaHanhDong> {
  const mo = await moNhom(slug);
  if (!mo) return { ok: false, loi: 'Nhóm không hợp lệ.' };

  const giaTri = bocTheoDacTa(mo.dacTa, form);
  const thieu = thieuTruongBatBuoc(mo.dacTa, giaTri);
  if (thieu) return { ok: false, loi: thieu };

  const dong = await mo.kho.sua(id, giaTri);
  if (!dong) return { ok: false, loi: 'Không tìm thấy mục cần sửa.' };
  revalidatePath(`/brand/${slug}`);
  revalidatePath('/brand');
  return { ok: true };
}

export async function xoaMuc(slug: string, id: string): Promise<KetQuaHanhDong> {
  const mo = await moNhom(slug);
  if (!mo) return { ok: false, loi: 'Nhóm không hợp lệ.' };

  const dong = await mo.kho.xoa(id);
  if (!dong) return { ok: false, loi: 'Không tìm thấy mục cần xoá.' };
  revalidatePath(`/brand/${slug}`);
  revalidatePath('/brand');
  return { ok: true };
}

export async function luuGiongDieu(form: FormData): Promise<KetQuaHanhDong> {
  const repo = createRepo(await workspaceHienTai());
  const chuoi = (ten: string) => {
    const tho = form.get(ten);
    const sach = typeof tho === 'string' ? tho.trim() : '';
    return sach === '' ? null : sach;
  };

  await repo.hoSo.luu({
    moTa: chuoi('moTa'),
    giongDieu: chuoi('giongDieu'),
    dieuCamKy: chuoi('dieuCamKy'),
    phongChu: chuoi('phongChu'),
  });
  revalidatePath('/brand/giong-dieu');
  revalidatePath('/brand');
  return { ok: true };
}

export type KetQuaXemTruoc =
  | { ok: true; banNhap: BanNhapHoSo; moHinh: string }
  | { ok: false; loi: string };

/**
 * Chay boc tach va tra ban nhap ve cho man hinh. KHONG ghi database — nguoi
 * dung phai xem va sua truoc. PRD muc 8.3: ghi thang ket qua mo hinh vao ho so
 * la sai lan ra toan he thong ma khong ai biet sai o dau.
 */
export async function xemTruocBocTach(vanBanTho: string): Promise<KetQuaXemTruoc> {
  const ketQua = await bocTachHoSo(await workspaceHienTai(), vanBanTho);
  if (!ketQua.ok) return { ok: false, loi: ketQua.loi };
  return { ok: true, banNhap: ketQua.banNhap, moHinh: ketQua.moHinh };
}

/**
 * Luu ban nhap NGUOI DUNG DA DUYET. Nhan ban nhap tu man hinh chu khong chay
 * lai boc tach: nguoi dung sua gi thi luu dung cai do, khong phai ban goc cua
 * mo hinh.
 */
export async function luuBanNhap(banNhap: BanNhapHoSo): Promise<KetQuaHanhDong> {
  const coChu = (giaTri: string | null) => typeof giaTri === 'string' && giaTri.trim() !== '';

  // MOT giao dich cho ca luot luu. Truoc day moi lenh ghi di rieng: hong o san
  // pham thu ba ma ho so va hai san pham dau da vao thi nguoi dung thu lai se
  // sinh ban trung, va khong co cach nao biet phan nao da vao.
  await trongGiaoDich(await workspaceHienTai(), async (repo) => {
    // Ho so: chi ghi de o nao ban nhap that su co chu, de khong xoa mat thu
    // nguoi dung da tu nhap truoc do.
    const hoSoCu = await repo.hoSo.layHoacTao();
    await repo.hoSo.luu({
      moTa: coChu(banNhap.hoSo.moTa) ? banNhap.hoSo.moTa : hoSoCu.moTa,
      giongDieu: coChu(banNhap.hoSo.giongDieu) ? banNhap.hoSo.giongDieu : hoSoCu.giongDieu,
      dieuCamKy: coChu(banNhap.hoSo.dieuCamKy) ? banNhap.hoSo.dieuCamKy : hoSoCu.dieuCamKy,
    });

    // Ba nhom danh sach: THEM moi, khong dong den dong da co. Boc tach lan hai
    // ma xoa sach roi ghi lai la mat thu nhan su da sua tay.
    for (const sp of banNhap.sanPham) await repo.sanPham.tao(sp);
    for (const cd of banNhap.chanDung) await repo.chanDung.tao(cd);
    for (const tc of banNhap.truCot) await repo.truCot.tao(tc);
  });

  revalidatePath('/brand');
  return { ok: true };
}
