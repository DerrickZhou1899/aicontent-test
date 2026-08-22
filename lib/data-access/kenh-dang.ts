/**
 * Repo bang `kenh_dang` — lien ket kenh cua nguoi dung tren tung be mat.
 *
 * Moi workspace co toi da mot kenh cho mot URL (rang buoc UNIQUE o CSDL), nhung
 * co the co nhieu be mat. Man cai dat hien nay chi dung ho so ca nhan Facebook.
 */

import { and, desc, eq } from 'drizzle-orm';

import { kenhDang } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

export type KenhDang = typeof kenhDang.$inferSelect;

export function kenhDangRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async list() {
      return db
        .select()
        .from(kenhDang)
        .where(eq(kenhDang.workspaceId, workspaceId))
        .orderBy(desc(kenhDang.ngayTao));
    },

    async theoBeMat(beMat: typeof kenhDang.$inferSelect.beMat) {
      const [dong] = await db
        .select()
        .from(kenhDang)
        .where(and(eq(kenhDang.workspaceId, workspaceId), eq(kenhDang.beMat, beMat)))
        .limit(1);
      return dong ?? null;
    },

    /**
     * Ghi lien ket kenh cho mot be mat. Mot be mat mot kenh: dat lai la SUA dong
     * cu chu khong them dong moi, neu khong lan keo sau khong biet theo dong nao.
     */
    async dat(beMat: typeof kenhDang.$inferSelect.beMat, urlKenh: string, tenHienThi?: string) {
      const cu = await this.theoBeMat(beMat);
      if (cu) {
        const [dong] = await db
          .update(kenhDang)
          .set({ urlKenh, tenHienThi: tenHienThi ?? cu.tenHienThi })
          .where(and(eq(kenhDang.workspaceId, workspaceId), eq(kenhDang.id, cu.id)))
          .returning();
        return dong;
      }
      const [dong] = await db
        .insert(kenhDang)
        .values({ workspaceId, beMat, urlKenh, tenHienThi: tenHienThi ?? null })
        .returning();
      return dong;
    },
  };
}
