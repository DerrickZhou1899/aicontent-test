/**
 * Repo bang `content_pillars` — tru cot noi dung (Phase 8).
 */

import { contentPillars } from '@/db/schema/index';

import { crudTheoWorkspace } from './crud-theo-workspace';
import type { KetNoiDrizzle } from './guard';

export type TruCot = typeof contentPillars.$inferSelect;

export function contentPillarsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return crudTheoWorkspace(db, workspaceId, contentPillars);
}
