/**
 * Repo bang `personas` — chan dung khach hang (Phase 8).
 */

import { personas } from '@/db/schema/index';

import { crudTheoWorkspace } from './crud-theo-workspace';
import type { KetNoiDrizzle } from './guard';

export type ChanDung = typeof personas.$inferSelect;

export function personasRepo(db: KetNoiDrizzle, workspaceId: string) {
  return crudTheoWorkspace(db, workspaceId, personas);
}
