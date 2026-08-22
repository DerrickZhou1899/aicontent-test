/**
 * Repo bang `model_runs` — nhat ky moi lan goi mo hinh.
 *
 * Ghi ca lan that bai (Phase 7): ti le hong theo tung mo hinh chi tinh duoc khi
 * mau so co du ca hai loai.
 */

import { and, desc, eq } from 'drizzle-orm';

import { modelRuns } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type GhiModelRun = Omit<typeof modelRuns.$inferInsert, 'workspaceId'>;

export function modelRunsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async ghi(duLieu: GhiModelRun) {
      const [dong] = await db
        .insert(modelRuns)
        .values({ ...duLieu, workspaceId })
        .returning();
      return dong;
    },

    async list(loc?: { gioiHan?: number }) {
      return db
        .select()
        .from(modelRuns)
        .where(eq(modelRuns.workspaceId, workspaceId))
        .orderBy(desc(modelRuns.ngayTao))
        .limit(loc?.gioiHan ?? 50);
    },

    async layTheoContent(contentId: string) {
      return db
        .select()
        .from(modelRuns)
        .where(
          and(eq(modelRuns.workspaceId, workspaceId), eq(modelRuns.contentId, contentId)),
        )
        .orderBy(desc(modelRuns.ngayTao));
    },
  };
}
