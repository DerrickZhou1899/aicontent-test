/**
 * Cau noi giua lop dang nhap va tang truy cap du lieu cho TRUC NGUOI DUNG.
 *
 * VI SAO LA FILE RIENG chu khong nam trong `current-workspace.ts`: file do ghi
 * ro no CO Y khong import gi tu `lib/data-access/`, de san pham khac cua SANG 5M
 * dung lai duoc lop dang nhap ma khong keo theo nghiep vu noi dung (PRD 11.1).
 * Cau noi thi phai cham ca hai ben, nen no o day — bo di la lop dang nhap sach
 * tro lai, khong phai go ra tung dong.
 *
 * Song song voi `workspaceHienTai()` va vi cung mot ly do: danh sach kenh theo
 * doi la rieng tung nguoi, nen `userId` lay tu form hay tham so URL la doc duoc
 * du lieu cua thanh vien khac.
 */

import { kiemUserId, type NguoiDungTuPhien } from '@/lib/data-access';

import { batBuocDangNhap } from './current-workspace';

export async function nguoiDungHienTai(): Promise<NguoiDungTuPhien> {
  const { userId } = await batBuocDangNhap();
  return kiemUserId(userId);
}

export type { NguoiDungTuPhien };
