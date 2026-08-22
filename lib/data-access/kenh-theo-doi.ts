/**
 * Repo bang `kenh_theo_doi` va `theo_doi_cua_toi` — kenh CUA NGUOI KHAC ma
 * workspace theo doi.
 *
 * Hai bang di chung mot file vi chung khong co nghia roi nhau: kho kenh la cua
 * chung workspace, con "toi theo doi cai nao" la rieng tung nguoi, va gan nhu
 * moi truy van deu can noi ca hai.
 *
 * MOI HAM NHAN `NguoiDungTuPhien` chu khong nhan `userId: string`. Doi thu tu
 * tham so `bat(kenhId, nguoi)` gio la loi bien dich chu khong phai loi chay —
 * xem ly do day du o `lib/data-access/guard.ts`.
 */

import { and, asc, count, eq, isNull, lt, or, sql } from 'drizzle-orm';

import { kenhTheoDoi, theoDoiCuaToi } from '@/db/schema/index';

import type { KetNoiDrizzle, NguoiDungTuPhien } from './guard';

export type KenhTheoDoi = typeof kenhTheoDoi.$inferSelect;
export type BeMatTheoDoi = KenhTheoDoi['beMat'];

/** Mot dong trong bang o man cai dat: kenh + toi co theo doi khong + bao nhieu nguoi theo. */
export type KenhKemTheoDoi = KenhTheoDoi & {
  toiTheoDoi: boolean;
  soNguoiTheoDoi: number;
};

export function kenhTheoDoiRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    /**
     * Danh sach cho man cai dat, kem trang thai theo doi cua CHINH nguoi dang xem.
     *
     * `soNguoiTheoDoi` co mat de nguoi dung thay duoc kenh nao dang thuc su duoc
     * keo: kenh khong ai theo doi van nam trong bang nhung khong bao gio duoc
     * keo (xem `canKeo`), neu khong hien ra thi ai cung tuong no dang chay.
     */
    async danhSachChoNguoi(nguoi: NguoiDungTuPhien): Promise<KenhKemTheoDoi[]> {
      // `leftJoin` + gop chu KHONG dung truy van con long trong `sql` template:
      // template khong bam duoc bang ngoai nen ca hai cot dan xuat deu ra rong.
      const dong = await db
        .select({
          kenh: kenhTheoDoi,
          soNguoiTheoDoi: sql<number>`count(${theoDoiCuaToi.id})::int`,
          toiTheoDoi: sql<boolean>`coalesce(bool_or(${theoDoiCuaToi.userId} = ${nguoi.userId}), false)`,
        })
        .from(kenhTheoDoi)
        .leftJoin(theoDoiCuaToi, eq(theoDoiCuaToi.kenhTheoDoiId, kenhTheoDoi.id))
        .where(eq(kenhTheoDoi.workspaceId, workspaceId))
        .groupBy(kenhTheoDoi.id)
        .orderBy(asc(kenhTheoDoi.ngayTao));

      return dong.map((d) => ({
        ...d.kenh,
        toiTheoDoi: d.toiTheoDoi,
        soNguoiTheoDoi: d.soNguoiTheoDoi,
      }));
    },

    /**
     * Them kenh vao kho chung. Da co URL do thi tra lai dong cu chu khong bao
     * loi — nguoi thu hai them cung mot kenh la chuyen binh thuong, khong phai
     * loi cua ho.
     */
    async themKenh(beMat: BeMatTheoDoi, urlKenh: string, tenHienThi?: string) {
      const [dong] = await db
        .insert(kenhTheoDoi)
        .values({ workspaceId, beMat, urlKenh, tenHienThi: tenHienThi ?? null })
        .onConflictDoUpdate({
          target: [kenhTheoDoi.workspaceId, kenhTheoDoi.urlKenh],
          set: { capNhat: new Date() },
        })
        .returning();
      return dong;
    },

    /** Tat o muc workspace: ngung keo, KHONG xoa bai da keo ve. */
    async datHoatDong(kenhId: string, dangHoatDong: boolean) {
      const [dong] = await db
        .update(kenhTheoDoi)
        .set({ dangHoatDong, capNhat: new Date() })
        .where(and(eq(kenhTheoDoi.workspaceId, workspaceId), eq(kenhTheoDoi.id, kenhId)))
        .returning();
      return dong ?? null;
    },

    async capNhatLanKeoCuoi(kenhId: string, moc: Date) {
      await db
        .update(kenhTheoDoi)
        .set({ lanKeoCuoi: moc, capNhat: new Date() })
        .where(and(eq(kenhTheoDoi.workspaceId, workspaceId), eq(kenhTheoDoi.id, kenhId)));
    },

    /**
     * Kenh den han keo: dang hoat dong, CO IT NHAT MOT nguoi theo doi, va lan
     * keo cuoi da qua `hanGio`.
     *
     * Dieu kien "co it nhat mot nguoi theo doi" la thu giu chi phi khong phinh:
     * kenh khong ai quan tam thi khong ton tien keo.
     */
    async canKeo(hanGio: number): Promise<KenhTheoDoi[]> {
      const moc = new Date(Date.now() - hanGio * 3600_000);
      return db
        .select({ k: kenhTheoDoi })
        .from(kenhTheoDoi)
        .innerJoin(theoDoiCuaToi, eq(theoDoiCuaToi.kenhTheoDoiId, kenhTheoDoi.id))
        .where(
          and(
            eq(kenhTheoDoi.workspaceId, workspaceId),
            eq(kenhTheoDoi.dangHoatDong, true),
            or(isNull(kenhTheoDoi.lanKeoCuoi), lt(kenhTheoDoi.lanKeoCuoi, moc)),
          ),
        )
        .groupBy(kenhTheoDoi.id)
        .then((dong) => dong.map((d) => d.k));
    },
  };
}

export function theoDoiCuaToiRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    /** Cac kenh MOT NGUOI CU THE theo doi. Truc co lap thu hai nam o day. */
    async cuaNguoiDung(nguoi: NguoiDungTuPhien): Promise<KenhTheoDoi[]> {
      const dong = await db
        .select({ k: kenhTheoDoi })
        .from(theoDoiCuaToi)
        .innerJoin(kenhTheoDoi, eq(kenhTheoDoi.id, theoDoiCuaToi.kenhTheoDoiId))
        .where(
          and(eq(theoDoiCuaToi.workspaceId, workspaceId), eq(theoDoiCuaToi.userId, nguoi.userId)),
        )
        .orderBy(asc(kenhTheoDoi.ngayTao));
      return dong.map((d) => d.k);
    },

    /**
     * Bat theo doi cho rieng nguoi nay.
     *
     * CHEN CO DIEU KIEN chu khong `values()` tran: `kenhId` di tu trinh duyet
     * len qua mot server action, ma khoa ngoai chi bat kenh do TON TAI chu khong
     * bat no thuoc workspace nay. Chen tran thi mot UUID kenh cua workspace khac
     * tao duoc dong theo doi tro cheo — chua lo du lieu (moi duong doc deu loc
     * lai theo `kenhTheoDoi.workspaceId`) nhung de lai rac, va `ON DELETE
     * CASCADE` khien workspace kia xoa kenh la am tham xoa dong cua minh.
     */
    async bat(nguoi: NguoiDungTuPhien, kenhId: string) {
      const [kenh] = await db
        .select({ id: kenhTheoDoi.id })
        .from(kenhTheoDoi)
        .where(and(eq(kenhTheoDoi.workspaceId, workspaceId), eq(kenhTheoDoi.id, kenhId)))
        .limit(1);
      // Kenh khong thuoc workspace nay thi lang le bo qua — khong nem loi, vi
      // day la duong nguoi dung bam nut, khong phai duong he thong.
      if (!kenh) return;

      await db
        .insert(theoDoiCuaToi)
        .values({ workspaceId, userId: nguoi.userId, kenhTheoDoiId: kenh.id })
        .onConflictDoNothing();
    },

    async tat(nguoi: NguoiDungTuPhien, kenhId: string) {
      await db
        .delete(theoDoiCuaToi)
        .where(
          and(
            eq(theoDoiCuaToi.workspaceId, workspaceId),
            eq(theoDoiCuaToi.userId, nguoi.userId),
            eq(theoDoiCuaToi.kenhTheoDoiId, kenhId),
          ),
        );
    },

    async dem(nguoi: NguoiDungTuPhien): Promise<number> {
      const [dong] = await db
        .select({ so: count() })
        .from(theoDoiCuaToi)
        .where(
          and(eq(theoDoiCuaToi.workspaceId, workspaceId), eq(theoDoiCuaToi.userId, nguoi.userId)),
        );
      return dong?.so ?? 0;
    },
  };
}
