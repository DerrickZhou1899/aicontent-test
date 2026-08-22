/**
 * Repo bang `insights` — su that ngam cua khach (Phase 8).
 */

import { insights } from '@/db/schema/index';

import { crudTheoWorkspace } from './crud-theo-workspace';
import type { KetNoiDrizzle } from './guard';

export type Insight = typeof insights.$inferSelect;

export function insightsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return crudTheoWorkspace(db, workspaceId, insights);
}
