/**
 * Repo bảng `ideas` — ý tưởng nội dung máy đề xuất hoặc người tự nhập (Phase 9).
 */

import { and, desc, eq } from 'drizzle-orm';

import { contentPillars, ideas, personas, trendSignals } from '@/db/schema/index';

import { crudTheoWorkspace } from './crud-theo-workspace';
import type { KetNoiDrizzle } from './guard';

export type Idea = typeof ideas.$inferSelect;
export type YTuongChiTiet = Idea & {
  tenTruCot    : string | null;
  tenChanDung  : string | null;
  tieuDeNguon  : string | null;
  lienKetNguon : string | null;
};

const cotYTuongChiTiet = {
  id            : ideas.id,
  workspaceId   : ideas.workspaceId,
  beMat         : ideas.beMat,
  tieuDe        : ideas.tieuDe,
  gocTiepCan    : ideas.gocTiepCan,
  pillarId      : ideas.pillarId,
  personaId     : ideas.personaId,
  productId     : ideas.productId,
  cauMoDau      : ideas.cauMoDau,
  lyDoDeXuat    : ideas.lyDoDeXuat,
  nguonYTuong   : ideas.nguonYTuong,
  trendSignalId : ideas.trendSignalId,
  modelRunId    : ideas.modelRunId,
  daDung        : ideas.daDung,
  ngayTao       : ideas.ngayTao,
  tenTruCot     : contentPillars.ten,
  tenChanDung   : personas.ten,
  tieuDeNguon   : trendSignals.tieuDe,
  lienKetNguon  : trendSignals.lienKet,
};

export function ideasRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    ...crudTheoWorkspace(db, workspaceId, ideas),

    async listChiTiet(): Promise<YTuongChiTiet[]> {
      return db
        .select(cotYTuongChiTiet)
        .from(ideas)
        .leftJoin(
          contentPillars,
          and(eq(contentPillars.id, ideas.pillarId), eq(contentPillars.workspaceId, workspaceId)),
        )
        .leftJoin(personas, and(eq(personas.id, ideas.personaId), eq(personas.workspaceId, workspaceId)))
        .leftJoin(
          trendSignals,
          and(eq(trendSignals.id, ideas.trendSignalId), eq(trendSignals.workspaceId, workspaceId)),
        )
        .where(eq(ideas.workspaceId, workspaceId))
        .orderBy(desc(ideas.ngayTao), desc(ideas.id));
    },

    async layChiTietTheoId(id: string): Promise<YTuongChiTiet | null> {
      const [dong] = await db
        .select(cotYTuongChiTiet)
        .from(ideas)
        .leftJoin(
          contentPillars,
          and(eq(contentPillars.id, ideas.pillarId), eq(contentPillars.workspaceId, workspaceId)),
        )
        .leftJoin(personas, and(eq(personas.id, ideas.personaId), eq(personas.workspaceId, workspaceId)))
        .leftJoin(
          trendSignals,
          and(eq(trendSignals.id, ideas.trendSignalId), eq(trendSignals.workspaceId, workspaceId)),
        )
        .where(and(eq(ideas.workspaceId, workspaceId), eq(ideas.id, id)))
        .limit(1);
      return dong ?? null;
    },

    async nhanQuyenSuDung(id: string, tieuDe: string): Promise<Idea | null> {
      // Claim có điều kiện để hai request đồng thời không cùng tạo bài từ một ý tưởng.
      const [dong] = await db
        .update(ideas)
        .set({ tieuDe, daDung: true })
        .where(and(
          eq(ideas.workspaceId, workspaceId),
          eq(ideas.id, id),
          eq(ideas.daDung, false),
        ))
        .returning();
      return dong ?? null;
    },

    async xoaChuaDung(id: string): Promise<Idea | null> {
      // Điều kiện nằm ngay trong DELETE để ý tưởng vừa được dùng không bị xóa bởi request đến chậm.
      const [dong] = await db
        .delete(ideas)
        .where(and(
          eq(ideas.workspaceId, workspaceId),
          eq(ideas.id, id),
          eq(ideas.daDung, false),
        ))
        .returning();
      return dong ?? null;
    },
  };
}
