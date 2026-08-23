/**
 * Repo bảng `contents` — bản tối thiểu.
 *
 * Phase 9 là chủ sở hữu file này về sau (bảng quản lý nội dung, bộ lọc 30 cột,
 * thao tác hàng loạt). Ở đây chỉ có đủ hàm để tầng truy cập dữ liệu có thể
 * chứng minh là nó thực sự chặn đọc chéo không gian làm việc.
 */

import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';

import { contents, ideas } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type LocNoiDung = {
  beMat?     : typeof contents.$inferSelect.beMat;
  trangThai? : typeof contents.$inferSelect.trangThai;
  gioiHan?   : number;
};

const cotBanNhapChiTiet = {
  ...getTableColumns(contents),
  tieuDeYTuong : ideas.tieuDe,
};

export function contentsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async list(loc?: LocNoiDung) {
      // Điều kiện phạm vi luôn là phần tử đầu, không phụ thuộc bộ lọc người dùng.
      const dieuKien = [eq(contents.workspaceId, workspaceId)];
      if (loc?.beMat) dieuKien.push(eq(contents.beMat, loc.beMat));
      if (loc?.trangThai) dieuKien.push(eq(contents.trangThai, loc.trangThai));

      return db
        .select()
        .from(contents)
        .where(and(...dieuKien))
        .orderBy(desc(contents.ngayTao), desc(contents.id))
        .limit(loc?.gioiHan ?? 50);
    },

    async listBanNhapChiTiet(gioiHan = 200) {
      return db
        .select(cotBanNhapChiTiet)
        .from(contents)
        .leftJoin(ideas, and(eq(ideas.id, contents.ideaId), eq(ideas.workspaceId, workspaceId)))
        .where(and(eq(contents.workspaceId, workspaceId), eq(contents.trangThai, 'ban_nhap')))
        .orderBy(desc(contents.ngayTao), desc(contents.id))
        .limit(gioiHan);
    },

    async layBanNhapChiTietTheoId(id: string) {
      const [dong] = await db
        .select(cotBanNhapChiTiet)
        .from(contents)
        .leftJoin(ideas, and(eq(ideas.id, contents.ideaId), eq(ideas.workspaceId, workspaceId)))
        .where(and(eq(contents.id, id), eq(contents.workspaceId, workspaceId)))
        .limit(1);
      return dong ?? null;
    },

    /**
     * Ghi một nội dung mới. `workspaceId` ghi đè SAU khi trải giá trị người gọi:
     * truyền workspace khác vào cũng không ghi sang không gian đó được.
     */
    async tao(giaTri: Omit<typeof contents.$inferInsert, 'workspaceId'>) {
      const [dong] = await db
        .insert(contents)
        .values({ ...giaTri, workspaceId })
        .returning();
      return dong;
    },

    /**
     * Sửa một nội dung đã lưu. `workspaceId` nằm trong ĐIỀU KIỆN chứ không nằm
     * trong giá trị ghi: biết đúng `id` của workspace khác cũng không sửa được,
     * và cũng không thể đổi một dòng sang workspace khác.
     */
    async sua(id: string, giaTri: Partial<Omit<typeof contents.$inferInsert, 'workspaceId' | 'id'>>) {
      const [dong] = await db
        .update(contents)
        .set(giaTri)
        .where(and(eq(contents.workspaceId, workspaceId), eq(contents.id, id)))
        .returning();
      return dong ?? null;
    },

    async layTheoId(id: string) {
      const [dong] = await db
        .select()
        .from(contents)
        .where(and(eq(contents.id, id), eq(contents.workspaceId, workspaceId)))
        .limit(1);
      return dong ?? null;
    },

    /**
     * Tìm bài có góc tiếp cận gần giống, trong `soNgay` ngày gần nhất.
     *
     * Dùng `similarity()` của pg_trgm (bật ở Phase 1). Truy vấn nằm Ở ĐÂY chứ
     * không ở `lib/studio/`: nếu tầng trên nhận thẳng một kết nối `db` để tự
     * viết SQL thì bất biến "mọi truy vấn đều đi qua tầng này" chỉ còn là lời
     * hứa. Studio gọi hàm này, không cầm kết nối.
     */
    async timTrungGoc(gocTiepCan: string, nguong: number, soNgay: number, gioiHan: number) {
      const goc = gocTiepCan.trim();
      if (goc === '') return [];

      const ketQua = await db.execute<{
        id           : string;
        cau_mo_dau   : string | null;
        goc_tiep_can : string | null;
        do_giong     : number;
      }>(sql`
        SELECT id, cau_mo_dau, goc_tiep_can, similarity(goc_tiep_can, ${goc}) AS do_giong
        FROM contents
        WHERE workspace_id = ${workspaceId}
          AND goc_tiep_can IS NOT NULL
          AND ngay_tao >= now() - make_interval(days => ${soNgay})
          AND similarity(goc_tiep_can, ${goc}) >= ${nguong}
        ORDER BY do_giong DESC
        LIMIT ${gioiHan}
      `);

      return ketQua.rows;
    },
  };
}
