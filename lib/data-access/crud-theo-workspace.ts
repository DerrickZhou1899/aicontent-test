/**
 * Khuon CRUD cho cac bang ho so thuong hieu.
 *
 * Bon bang `products` / `personas` / `insights` / `content_pillars` khac nhau
 * dung o danh sach cot, con cach doc ghi thi giong het. Viet tay bon lan la bon
 * co hoi de mot lan quen `eq(bang.workspaceId, workspaceId)` — dung lo hong ma
 * ca tang nay sinh ra de chan.
 *
 * Moi ham o day deu neo pham vi bang dieu kien DAU TIEN, khong phu thuoc tham so
 * nguoi goi truyen vao.
 */

import { and, desc, eq, type SQL } from 'drizzle-orm';

import type { KetNoiDrizzle } from './guard';

/**
 * Khuon doi bang phai co du ba manh ghep chung cua `db/schema/auth`: `id`,
 * `workspaceId`, `ngayTao`. Ca bon bang ho so deu co.
 *
 *
 * Dung `any` o day la co y va bi khoanh vung trong DUY NHAT file nay: Drizzle
 * suy kieu tung bang qua generic rat sau, mo ta lai cho khuon dung chung thi
 * phai chep gan het he kieu cua no. Nhung ham xuat ra ben duoi van giu kieu
 * that cua tung bang nho `typeof bang.$inferSelect` o cac file goi.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function crudTheoWorkspace<Bang extends Record<string, any>>(
  db: KetNoiDrizzle,
  workspaceId: string,
  bang: Bang,
) {
  const trongPhamVi = (them?: SQL) =>
    them ? and(eq(bang.workspaceId, workspaceId), them) : eq(bang.workspaceId, workspaceId);

  return {
    async list(gioiHan = 200) {
      return (db as any)
        .select()
        .from(bang)
        .where(trongPhamVi())
        .orderBy(desc(bang.ngayTao))
        .limit(gioiHan);
    },

    async layTheoId(id: string) {
      const [dong] = await (db as any)
        .select()
        .from(bang)
        .where(trongPhamVi(eq(bang.id, id)))
        .limit(1);
      return dong ?? null;
    },

    async tao(gia_tri: Record<string, unknown>) {
      // Ghi de `workspaceId` SAU khi trai gia tri nguoi goi: nguoi goi truyen
      // workspace khac vao cung khong ghi sang khong gian do duoc.
      const [dong] = await (db as any)
        .insert(bang)
        .values({ ...gia_tri, workspaceId })
        .returning();
      return dong;
    },

    async sua(id: string, gia_tri: Record<string, unknown>) {
      const { workspaceId: _bo, id: _boId, ...conLai } = gia_tri as Record<string, unknown>;
      const [dong] = await (db as any)
        .update(bang)
        .set(conLai)
        .where(trongPhamVi(eq(bang.id, id)))
        .returning();
      return dong ?? null;
    },

    async xoa(id: string) {
      const [dong] = await (db as any)
        .delete(bang)
        .where(trongPhamVi(eq(bang.id, id)))
        .returning();
      return dong ?? null;
    },

    async dem() {
      const dong = await (db as any).select().from(bang).where(trongPhamVi());
      return dong.length;
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
