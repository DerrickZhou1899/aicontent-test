/**
 * Repo bảng `jobs` — phần trong phạm vi một không gian làm việc.
 *
 * Việc lấy việc chéo không gian làm việc (FOR UPDATE SKIP LOCKED) KHÔNG ở đây:
 * nó cần đọc hết mọi workspace nên phải đi qua `createSystemRepo()`, vào vai trò
 * PostgreSQL riêng của tiến trình nền.
 */

import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { jobs } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type ThemJob = Omit<typeof jobs.$inferInsert, 'workspaceId'>;
type SuaJob = Partial<Omit<typeof jobs.$inferInsert, 'workspaceId' | 'id'>>;

export function jobsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async list(loc?: { trangThai?: typeof jobs.$inferSelect.trangThai; gioiHan?: number }) {
      const dieuKien = loc?.trangThai
        ? and(eq(jobs.workspaceId, workspaceId), eq(jobs.trangThai, loc.trangThai))
        : eq(jobs.workspaceId, workspaceId);

      return db
        .select()
        .from(jobs)
        .where(dieuKien)
        .orderBy(desc(jobs.ngayTao))
        .limit(loc?.gioiHan ?? 50);
    },

    async layTheoId(id: string) {
      const [dong] = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, id), eq(jobs.workspaceId, workspaceId)))
        .limit(1);
      return dong ?? null;
    },

    /**
     * Lấy nhiều việc một lượt, LỌC THEO WORKSPACE.
     *
     * Màn sinh hàng loạt hỏi tiến độ cả lô mỗi ba giây. Hỏi từng việc một là N
     * truy vấn mỗi nhịp trên một bể chỉ 6 kết nối; hỏi bằng `layKetQua` của
     * model-runner thì dùng ID thô không lọc workspace, tức ai biết một jobId
     * của khách khác là đọc được nguyên bài của họ. Một câu, có điều kiện
     * workspace, giải quyết cả hai.
     */
    async layNhieuTheoId(ids: string[]) {
      if (ids.length === 0) return [];
      return db
        .select()
        .from(jobs)
        .where(and(eq(jobs.workspaceId, workspaceId), inArray(jobs.id, ids)));
    },

    async them(duLieu: ThemJob) {
      const [dong] = await db
        .insert(jobs)
        .values({ ...duLieu, workspaceId })
        .returning();
      return dong;
    },

    /**
     * Chỉ một request được phép lưu ý tưởng của một job đã xong. Đánh dấu và
     * insert nằm trong cùng giao dịch của caller, nên insert hỏng sẽ rollback
     * marker này và lần thử lại vẫn có thể nhận quyền lưu.
     */
    async nhanQuyenLuuYTuong(id: string): Promise<boolean> {
      const [dong] = await db
        .update(jobs)
        .set({
          ketQua : sql`jsonb_set(
            coalesce(${jobs.ketQua}, '{}'::jsonb),
            '{_studioDaLuuYTuong}',
            'true'::jsonb,
            true
          )`,
        })
        .where(and(
          eq(jobs.workspaceId, workspaceId),
          eq(jobs.id, id),
          eq(jobs.trangThai, 'xong'),
          sql`not (coalesce(${jobs.ketQua}, '{}'::jsonb) ? '_studioDaLuuYTuong')`,
        ))
        .returning({ id: jobs.id });
      return dong !== undefined;
    },

    async capNhat(id: string, thayDoi: SuaJob) {
      const [dong] = await db
        .update(jobs)
        .set({ ...thayDoi, capNhat: new Date() })
        .where(and(eq(jobs.id, id), eq(jobs.workspaceId, workspaceId)))
        .returning();
      return dong ?? null;
    },
  };
}
