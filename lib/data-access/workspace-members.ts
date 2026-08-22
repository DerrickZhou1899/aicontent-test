/**
 * Repo bang `workspace_members`.
 *
 * `laThanhVien()` la truy van ma Phase 6 phai goi truoc khi doi khong gian lam
 * viec: `createRepo()` tin gia tri nguoi goi truyen vao, nen kiem tu cach thanh
 * vien phai lam o mot buoc rieng, khong lam o day.
 */

import { and, eq } from 'drizzle-orm';

import { workspaceMembers } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type VaiTro = (typeof workspaceMembers.$inferInsert)['vaiTro'];

export function workspaceMembersRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async list() {
      return db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));
    },

    async laThanhVien(userId: string) {
      const [dong] = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
          ),
        )
        .limit(1);
      return dong !== undefined;
    },

    async them(userId: string, vaiTro?: VaiTro) {
      const [dong] = await db
        .insert(workspaceMembers)
        // `workspaceId` dat sau cung: khong loi goi nao ghi de duoc pham vi.
        .values({ userId, vaiTro, workspaceId })
        .returning();
      return dong;
    },
  };
}
