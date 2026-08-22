/**
 * Repo bang `ideas` — y tuong noi dung may de xuat hoac nguoi tu nhap (Phase 9).
 */

import { ideas } from '@/db/schema/index';

import { crudTheoWorkspace } from './crud-theo-workspace';
import type { KetNoiDrizzle } from './guard';

export type Idea = typeof ideas.$inferSelect;

export function ideasRepo(db: KetNoiDrizzle, workspaceId: string) {
  return crudTheoWorkspace(db, workspaceId, ideas);
}
