/**
 * Repo bang `jobs` — phan trong pham vi mot khong gian lam viec.
 *
 * Viec lay viec cheo khong gian lam viec (FOR UPDATE SKIP LOCKED) KHONG o day:
 * no can doc het moi workspace nen phai di qua `createSystemRepo()`, vao vai tro
 * PostgreSQL rieng cua tien trinh nen.
 */

import { and, desc, eq, inArray } from 'drizzle-orm';

import { jobs } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type ThemJob = Omit<typeof jobs.$inferInsert, 'workspaceId'>;
type SuaJob = Partial<Omit<typeof jobs.$inferInsert, 'workspaceId' | 'id'>>;

export function jobsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async list(loc?: { trangThai?: typeof jobs.$inferSelect.trangThai; gioiHan?: number }) {
      const dieuKien = loc?.trangThai
        ? and(eq(jobs.workspaceId, workspaceId), eq(jobs.trangThai, loc.trangThai))
        : eq(jobs.workspaceId, workspaceId);

      return db
        .select()
        .from(jobs)
        .where(dieuKien)
        .orderBy(desc(jobs.ngayTao))
        .limit(loc?.gioiHan ?? 50);
    },

    async layTheoId(id: string) {
      const [dong] = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, id), eq(jobs.workspaceId, workspaceId)))
        .limit(1);
      return dong ?? null;
    },

    /**
     * Lay nhieu viec mot luot, LOC THEO WORKSPACE.
     *
     * Man sinh hang loat hoi tien do ca lo moi ba giay. Hoi tung viec mot la N
     * truy van moi nhip tren mot be chi 6 ket noi; hoi bang `layKetQua` cua
     * model-runner thi dung ID tho khong loc workspace, tuc ai biet mot jobId
     * cua khach khac la doc duoc nguyen bai cua ho. Mot cau, co dieu kien
     * workspace, giai quyet ca hai.
     */
    async layNhieuTheoId(ids: string[]) {
      if (ids.length === 0) return [];
      return db
        .select()
        .from(jobs)
        .where(and(eq(jobs.workspaceId, workspaceId), inArray(jobs.id, ids)));
    },

    async them(duLieu: ThemJob) {
      const [dong] = await db
        .insert(jobs)
        .values({ ...duLieu, workspaceId })
        .returning();
      return dong;
    },

    async capNhat(id: string, thayDoi: SuaJob) {
      const [dong] = await db
        .update(jobs)
        .set({ ...thayDoi, capNhat: new Date() })
        .where(and(eq(jobs.id, id), eq(jobs.workspaceId, workspaceId)))
        .returning();
      return dong ?? null;
    },
  };
}
