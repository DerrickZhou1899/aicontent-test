/**
 * Repo bang `workspaces`.
 *
 * Bang nay la ngoai le duy nhat ve ten cot: pham vi nam o `id` chu khong phai
 * `workspace_id`. Dieu kien loc van bat buoc — khong co ham nao doc duoc dong
 * cua khong gian lam viec khac.
 */

import { eq } from 'drizzle-orm';

import { workspaces } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type SuaWorkspace = Partial<{
  ten: string;
  ngonNgu: string;
  muiGio: string;
}>;

export function workspacesRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async layHienTai() {
      const [dong] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      return dong ?? null;
    },

    async capNhat(thayDoi: SuaWorkspace) {
      const [dong] = await db
        .update(workspaces)
        .set({ ...thayDoi, capNhat: new Date() })
        .where(eq(workspaces.id, workspaceId))
        .returning();
      return dong ?? null;
    },
  };
}
