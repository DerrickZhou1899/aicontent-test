/**
 * Repo bang `products` — mot trong nam nhom cua ho so thuong hieu (Phase 8).
 */

import { products } from '@/db/schema/index';

import { crudTheoWorkspace } from './crud-theo-workspace';
import type { KetNoiDrizzle } from './guard';

export type SanPham = typeof products.$inferSelect;

export function productsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return crudTheoWorkspace(db, workspaceId, products);
}
