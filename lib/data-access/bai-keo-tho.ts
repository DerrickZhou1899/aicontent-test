/**
 * Repo bang `bai_keo_tho` — ban tho cua bai keo ve tu nen tang ngoai.
 *
 * `daCoMaBai` la thu chan keo trung: keo lai cung mot kenh la chuyen binh thuong
 * (co bai moi), nhung bai da co khong duoc sinh them mot ban nua trong `contents`.
 */

import { and, eq, inArray } from 'drizzle-orm';

import { baiKeoTho } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

export function baiKeoThoRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    /** Cac ma bai DA co trong kho, trong so ma truyen vao. */
    async maBaiDaCo(maBai: string[]): Promise<Set<string>> {
      if (maBai.length === 0) return new Set();
      const dong = await db
        .select({ maBai: baiKeoTho.maBai })
        .from(baiKeoTho)
        .where(and(eq(baiKeoTho.workspaceId, workspaceId), inArray(baiKeoTho.maBai, maBai)));
      return new Set(dong.map((d) => d.maBai));
    },

    async tao(giaTri: Omit<typeof baiKeoTho.$inferInsert, 'workspaceId'>) {
      const [dong] = await db
        .insert(baiKeoTho)
        .values({ ...giaTri, workspaceId })
        .returning();
      return dong;
    },

    /** Ban tho cua nhieu bai mot luot — cho bang bai da dang doc so lieu. */
    async theoNhieuContentId(contentIds: string[]) {
      if (contentIds.length === 0) return [];
      return db
        .select()
        .from(baiKeoTho)
        .where(
          and(eq(baiKeoTho.workspaceId, workspaceId), inArray(baiKeoTho.contentId, contentIds)),
        );
    },

    /**
     * Chay lai bo boc tren ban tho DA LUU va ghi de so lieu.
     *
     * Day la thu ma viec giu ban tho mua duoc: bo boc dem sai thi sua roi chay
     * lai tren toan bo lich su, khong ton mot luot goi Apify nao.
     */
    async ghiDeSoLieu(
      id: string,
      soLieu: {
        soThich: number | null;
        soBinhLuan: number | null;
        soChiaSe: number | null;
        thoiLuongVideoMs: number | null;
      },
    ) {
      const [dong] = await db
        .update(baiKeoTho)
        .set(soLieu)
        .where(and(eq(baiKeoTho.workspaceId, workspaceId), eq(baiKeoTho.id, id)))
        .returning();
      return dong ?? null;
    },

    async theoContentId(contentId: string) {
      const [dong] = await db
        .select()
        .from(baiKeoTho)
        .where(and(eq(baiKeoTho.workspaceId, workspaceId), eq(baiKeoTho.contentId, contentId)))
        .limit(1);
      return dong ?? null;
    },
  };
}
