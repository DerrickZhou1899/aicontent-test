/**
 * Repo bang `contents` — ban toi thieu.
 *
 * Phase 9 la chu so huu file nay ve sau (bang quan ly noi dung, bo loc 30 cot,
 * thao tac hang loat). O day chi co du ham de tang truy cap du lieu co the
 * chung minh la no thuc su chan doc cheo khong gian lam viec.
 */

import { and, desc, eq, sql } from 'drizzle-orm';

import { contents } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

type LocNoiDung = {
  beMat?: typeof contents.$inferSelect.beMat;
  trangThai?: typeof contents.$inferSelect.trangThai;
  gioiHan?: number;
};

export function contentsRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async list(loc?: LocNoiDung) {
      // Dieu kien pham vi luon la phan tu dau, khong phu thuoc bo loc nguoi dung.
      const dieuKien = [eq(contents.workspaceId, workspaceId)];
      if (loc?.beMat) dieuKien.push(eq(contents.beMat, loc.beMat));
      if (loc?.trangThai) dieuKien.push(eq(contents.trangThai, loc.trangThai));

      return db
        .select()
        .from(contents)
        .where(and(...dieuKien))
        .orderBy(desc(contents.ngayTao))
        .limit(loc?.gioiHan ?? 50);
    },

    /**
     * Ghi mot noi dung moi. `workspaceId` ghi de SAU khi trai gia tri nguoi goi:
     * truyen workspace khac vao cung khong ghi sang khong gian do duoc.
     */
    async tao(giaTri: Omit<typeof contents.$inferInsert, 'workspaceId'>) {
      const [dong] = await db
        .insert(contents)
        .values({ ...giaTri, workspaceId })
        .returning();
      return dong;
    },

    /**
     * Sua mot noi dung da luu. `workspaceId` nam trong DIEU KIEN chu khong nam
     * trong gia tri ghi: biet dung `id` cua workspace khac cung khong sua duoc,
     * va cung khong the doi mot dong sang workspace khac.
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
     * Tim bai co goc tiep can gan giong, trong `soNgay` ngay gan nhat.
     *
     * Dung `similarity()` cua pg_trgm (bat o Phase 1). Truy van nam O DAY chu
     * khong o `lib/studio/`: neu tang tren nhan thang mot ket noi `db` de tu
     * viet SQL thi bat bien "moi truy van deu di qua tang nay" chi con la loi
     * hua. Studio goi ham nay, khong cam ket noi.
     */
    async timTrungGoc(gocTiepCan: string, nguong: number, soNgay: number, gioiHan: number) {
      const goc = gocTiepCan.trim();
      if (goc === '') return [];

      const ketQua = await db.execute<{
        id: string;
        cau_mo_dau: string | null;
        goc_tiep_can: string | null;
        do_giong: number;
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
