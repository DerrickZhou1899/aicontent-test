/**
 * Cua duy nhat de ma phia may chu biet "ai dang dung, o khong gian lam viec nao".
 *
 * File nay CO Y khong import gi tu `lib/data-access/`: no chi doc phien va tra
 * ve `{ userId, workspaceId }`. Viec dua `workspaceId` do vao `createRepo()` la
 * cua tang truy cap du lieu, khong phai cua lop dang nhap. Giu ranh gioi nay thi
 * san pham thu ba cua SANG 5M dung lai duoc lop dang nhap ma khong keo theo
 * nghiep vu noi dung (PRD muc 11.1).
 */

import { auth } from '@/auth';

export type NguoiDungHienTai = {
  userId: string;
  workspaceId: string;
};

/** Tra `null` khi chua dang nhap hoac phien khong gan voi khong gian lam viec nao. */
export async function layNguoiDungHienTai(): Promise<NguoiDungHienTai | null> {
  const phien = await auth();
  const userId = phien?.user?.id;
  const workspaceId = phien?.workspaceId;
  if (!userId || !workspaceId) return null;
  return { userId, workspaceId };
}

/**
 * Dung cho man hinh/hanh dong bat buoc dang nhap. Nem loi thay vi tra ve gia tri
 * rong: goi tiep voi `workspaceId` rong la doc du lieu cua nguoi khac.
 */
export async function batBuocDangNhap(): Promise<NguoiDungHienTai> {
  const nguoiDung = await layNguoiDungHienTai();
  if (!nguoiDung) {
    throw new Error('Chua dang nhap hoac phien khong co khong gian lam viec');
  }
  return nguoiDung;
}

/**
 * Chi tra `workspaceId`, doc tu phien dang nhap.
 *
 * Ton tai vi bo quet cua Phase 5 (`tests/quet-tang-truy-cap.cjs`) chi chap nhan
 * DUNG mot dang trong `app/`: `createRepo(await workspaceHienTai())`. Bat theo
 * ten ham la co y — `createRepo(body.workspaceId)` doc duoc du lieu khach khac
 * ma van qua het ba lop bao ve, nen tang quet phai nhan dien duoc nguon goc gia
 * tri chu khong chi kieu du lieu cua no.
 */
export async function workspaceHienTai(): Promise<string> {
  const { workspaceId } = await batBuocDangNhap();
  return workspaceId;
}
