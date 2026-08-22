/**
 * Khuôn CRUD cho các bảng hồ sơ thương hiệu.
 *
 * Bốn bảng `products` / `personas` / `insights` / `content_pillars` khác nhau
 * đúng ở danh sách cột, còn cách đọc ghi thì giống hết. Viết tay bốn lần là bốn
 * cơ hội để một lần quên `eq(bang.workspaceId, workspaceId)` — đúng lỗ hổng mà
 * cả tầng này sinh ra để chặn.
 *
 * Mỗi hàm ở đây đều neo phạm vi bằng điều kiện ĐẦU TIÊN, không phụ thuộc tham số
 * người gọi truyền vào.
 */

import { and, desc, eq, type SQL } from 'drizzle-orm';

import type { KetNoiDrizzle } from './guard';

/**
 * Khuôn đòi bảng phải có đủ ba mảnh ghép chung của `db/schema/auth`: `id`,
 * `workspaceId`, `ngayTao`. Cả bốn bảng hồ sơ đều có.
 *
 *
 * Dùng `any` ở đây là có ý và bị khoanh vùng trong DUY NHẤT file này: Drizzle
 * suy kiểu từng bảng qua generic rất sâu, mô tả lại cho khuôn dùng chung thì
 * phải chép gần hết hệ kiểu của nó. Những hàm xuất ra bên dưới vẫn giữ kiểu
 * thật của từng bảng nhờ `typeof bang.$inferSelect` ở các file gọi.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function crudTheoWorkspace<Bang extends Record<string, any>>(
  db          : KetNoiDrizzle,
  workspaceId : string,
  bang        : Bang,
) {
  const trongPhamVi = (them?: SQL) =>
    them ? and(eq(bang.workspaceId, workspaceId), them) : eq(bang.workspaceId, workspaceId);

  return {
    async list(gioiHan = 200) {
      return (db as any)
        .select()
        .from(bang)
        .where(trongPhamVi())
        .orderBy(desc(bang.ngayTao), desc(bang.id))
        .limit(gioiHan);
    },

    async layTheoId(id: string) {
      const [dong] = await (db as any)
        .select()
        .from(bang)
        .where(trongPhamVi(eq(bang.id, id)))
        .limit(1);
      return dong ?? null;
    },

    async tao(gia_tri: Record<string, unknown>) {
      // Ghi đè `workspaceId` SAU khi trải giá trị người gọi: người gọi truyền
      // workspace khác vào cũng không ghi sang không gian đó được.
      const [dong] = await (db as any)
        .insert(bang)
        .values({ ...gia_tri, workspaceId })
        .returning();
      return dong;
    },

    async sua(id: string, gia_tri: Record<string, unknown>) {
      const { workspaceId: _bo, id: _boId, ...conLai } = gia_tri as Record<string, unknown>;
      const [dong] = await (db as any)
        .update(bang)
        .set(conLai)
        .where(trongPhamVi(eq(bang.id, id)))
        .returning();
      return dong ?? null;
    },

    async xoa(id: string) {
      const [dong] = await (db as any)
        .delete(bang)
        .where(trongPhamVi(eq(bang.id, id)))
        .returning();
      return dong ?? null;
    },

    async dem() {
      const dong = await (db as any).select().from(bang).where(trongPhamVi());
      return dong.length;
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
