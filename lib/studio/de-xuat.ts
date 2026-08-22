import type { NguoiDungTuPhien } from '@/lib/data-access';

import { taoDichVuDeXuat } from './de-xuat-service';
import type { ThamSoDeXuat } from './de-xuat-thuan';
import type { KetQuaStudio, YTuongDeXuat } from './kieu';

export {
  donKetQuaDeXuat,
  donYTuongTheoSlot,
  khoaChongTrungDeXuat,
  raiTheoTruCot,
  taoSlotDeXuat,
  TI_LE_KHAM_PHA,
} from './de-xuat-thuan';
export type { ThamSoDeXuat, TruCotMucTieu } from './de-xuat-thuan';
export { taoDichVuDeXuat } from './de-xuat-service';

const dichVuMacDinh = taoDichVuDeXuat();

export async function deXuatYTuong(
  thamSo    : ThamSoDeXuat,
  nguoiDung : NguoiDungTuPhien | undefined = undefined,
): Promise<KetQuaStudio<YTuongDeXuat[]>> {
  return dichVuMacDinh(thamSo, nguoiDung);
}
