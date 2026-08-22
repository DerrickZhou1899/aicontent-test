/**
 * Doc ca nam nhom ho so cua khong gian lam viec dang dang nhap, roi tinh do
 * day du.
 *
 * Dung o ca trang tong quan lan cac trang nhom, nen dat rieng thay vi chep hai
 * lan — hai ban chep se lech nhau ngay lan dau doi dieu kien.
 */

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { tinhDoDayDu, type KetQuaDoDayDu } from '@/lib/brand/do-day-du';
import { createRepo } from '@/lib/data-access';

export type ToanBoHoSo = {
  hoSo: Awaited<ReturnType<ReturnType<typeof createRepo>['hoSo']['lay']>>;
  sanPham: Record<string, unknown>[];
  chanDung: Record<string, unknown>[];
  insight: Record<string, unknown>[];
  truCot: Record<string, unknown>[];
  doDayDu: KetQuaDoDayDu;
};

export async function docToanBoHoSo(): Promise<ToanBoHoSo> {
  const repo = createRepo(await workspaceHienTai());

  // Nam luot doc doc lap nhau — chay song song thay vi noi duoi.
  const [hoSo, sanPham, chanDung, insight, truCot] = await Promise.all([
    repo.hoSo.lay(),
    repo.sanPham.list(),
    repo.chanDung.list(),
    repo.insight.list(),
    repo.truCot.list(),
  ]);

  return {
    hoSo,
    sanPham,
    chanDung,
    insight,
    truCot,
    doDayDu: tinhDoDayDu({ hoSo, sanPham, chanDung, insight, truCot }),
  };
}
