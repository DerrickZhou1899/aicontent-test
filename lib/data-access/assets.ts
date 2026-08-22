/**
 * Repo bang `assets` — anh, video, tep dinh kem cua mot noi dung.
 *
 * `duongDan` la duong dan tuong doi trong kho tren dia (anh da tai ve);
 * `urlNgoai` la lien ket CDN goc (video khong tai ve). Mot dong phai co it nhat
 * mot trong hai — rang buoc CHECK o CSDL cuong che dieu do.
 */

import { and, asc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';

import { assets } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

export type Asset = typeof assets.$inferSelect;

export function assetsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async theoNoiDung(contentIds: string[]) {
      if (contentIds.length === 0) return [];
      return db
        .select()
        .from(assets)
        .where(and(eq(assets.workspaceId, workspaceId), inArray(assets.contentId, contentIds)))
        .orderBy(asc(assets.ngayTao));
    },

    /**
     * Anh da ghi nhan nhung CHUA co tep tren dia.
     *
     * Sinh ra khi tai anh hong giua luot keo — vi du nut CDN cua Facebook khong
     * di toi duoc tu may chu nay. Luot keo sau se thu lai chung, nen mot su co
     * mang tam thoi khong lam mat anh vinh vien.
     */
    async anhChuaTai(gioiHan = 200) {
      return db
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.workspaceId, workspaceId),
            eq(assets.loai, 'anh'),
            isNull(assets.duongDan),
            isNotNull(assets.urlNgoai),
          ),
        )
        .limit(gioiHan);
    },

    async datDuongDan(id: string, duongDan: string, kichThuocByte: number) {
      const [dong] = await db
        .update(assets)
        .set({ duongDan, kichThuocByte })
        .where(and(eq(assets.workspaceId, workspaceId), eq(assets.id, id)))
        .returning();
      return dong ?? null;
    },

    async tao(giaTri: Omit<typeof assets.$inferInsert, 'workspaceId'>) {
      const [dong] = await db
        .insert(assets)
        .values({ ...giaTri, workspaceId })
        .returning();
      return dong;
    },

    async layTheoId(id: string) {
      const [dong] = await db
        .select()
        .from(assets)
        .where(and(eq(assets.workspaceId, workspaceId), eq(assets.id, id)))
        .limit(1);
      return dong ?? null;
    },

    async datPhuDe(id: string, phuDe: string) {
      const [dong] = await db
        .update(assets)
        .set({ phuDe })
        .where(and(eq(assets.workspaceId, workspaceId), eq(assets.id, id)))
        .returning();
      return dong ?? null;
    },
  };
}
