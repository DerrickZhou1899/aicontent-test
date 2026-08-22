/**
 * Repo bang `cost_log` — so ke chi phi.
 *
 * PRD muc 12.3: phai cong duoc theo khong gian lam viec va theo thang ngay tu
 * V1, du V1 chi co mot nguoi dung. Sau 1-2 thang moi co con so that de dat gia.
 */

import { and, eq, gte, lt, sum } from 'drizzle-orm';

import { costLog } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type GhiChiPhi = Omit<typeof costLog.$inferInsert, 'workspaceId'>;

/**
 * Viet Nam la UTC+7 co dinh, khong co gio mua he — nen moc dau/cuoi thang tinh
 * bang do lech cung la dung, khong can bang mui gio cua PostgreSQL.
 */
const LECH_GIO_VN = 7;

function mocDauThang(nam: number, thang: number): Date {
  return new Date(Date.UTC(nam, thang - 1, 1, -LECH_GIO_VN, 0, 0, 0));
}

export function costLogRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async ghi(duLieu: GhiChiPhi) {
      const [dong] = await db
        .insert(costLog)
        .values({ ...duLieu, workspaceId })
        .returning();
      return dong;
    },

    /**
     * Tong chi phi mot thang, tach theo tung loai chi phi VA theo don vi tien.
     *
     * TACH THEO DON VI LA BAT BUOC, khong phai tien nghi: chi phi goi mo hinh
     * ghi bang VND (hang chuc nghin moi dong), chi phi Apify ghi bang USD (vai
     * phan chuc moi dong). Cong gop hai don vi vao mot so lam sai lech co ti gia
     * — va bang nay la can cu dat gia ban (PRD 12.3), khong phai so lieu tham
     * khao.
     *
     * `tong` CHI cong cac dong VND. Doc so USD o `theoDonVi`. Doi `tong` thanh
     * tong tat ca la lam hong lai dung cai vua duoc va.
     */
    async tongTheoThang(nam: number, thang: number) {
      const tu = mocDauThang(nam, thang);
      const den = mocDauThang(thang === 12 ? nam + 1 : nam, thang === 12 ? 1 : thang + 1);

      const dong = await db
        .select({
          loaiChiPhi: costLog.loaiChiPhi,
          donViTien: costLog.donViTien,
          tong: sum(costLog.chiPhiUocTinh),
        })
        .from(costLog)
        .where(
          and(
            eq(costLog.workspaceId, workspaceId),
            gte(costLog.ngay, tu),
            lt(costLog.ngay, den),
          ),
        )
        .groupBy(costLog.loaiChiPhi, costLog.donViTien);

      const theoLoai = dong.map((d) => ({
        loaiChiPhi: d.loaiChiPhi,
        donViTien: d.donViTien,
        tong: Number(d.tong ?? 0),
      }));

      const theoDonVi = [...new Set(theoLoai.map((d) => d.donViTien))].map((donViTien) => ({
        donViTien,
        tong: theoLoai.filter((d) => d.donViTien === donViTien).reduce((c, d) => c + d.tong, 0),
      }));

      return {
        tong: theoDonVi.find((d) => d.donViTien === 'VND')?.tong ?? 0,
        theoDonVi,
        theoLoai,
      };
    },
  };
}
