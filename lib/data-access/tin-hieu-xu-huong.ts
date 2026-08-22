/**
 * Repo bang `trend_signals` — mot bai cua kenh ngoai da keo ve.
 *
 * Bang nay co tu Phase 3 nhung khong ai dung. Mo rong no thay vi tao bang moi
 * vi `ideas.trend_signal_id` da tro vao day: tao bang moi la de bang nay chet
 * vinh vien VA phai them khoa ngoai thu hai len `ideas`.
 */

import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { kenhTheoDoi, theoDoiCuaToi, trendSignals } from '@/db/schema/index';

import type { KetNoiDrizzle, NguoiDungTuPhien } from './guard';

export type TinHieuXuHuong = typeof trendSignals.$inferSelect;

/** Mot bai kenh ngoai chuan bi ghi. `null` o cot so lieu = KHONG DO DUOC, khac 0. */
export type BaiGhiVao = {
  kenhTheoDoiId: string;
  nguon: string;
  maBai: string;
  lienKet: string | null;
  noiDung: string;
  thoiDiem: Date | null;
  dangBai: TinHieuXuHuong['dangBai'];
  soThich: number | null;
  soBinhLuan: number | null;
  soChiaSe: number | null;
  thoiLuongVideoMs: number | null;
  tho: unknown;
};

/** `tieu_de` la NOT NULL tu Phase 3 — dung dong dau cua noi dung lam tieu de. */
function dungTieuDe(noiDung: string): string {
  const dongDau = noiDung.split('\n').find((d) => d.trim() !== '');
  if (!dongDau) return '(khong co chu)';
  const sach = dongDau.trim();
  return sach.length > 200 ? `${sach.slice(0, 197)}...` : sach;
}

export function tinHieuXuHuongRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    /**
     * Ghi nhieu bai, bo qua bai da co.
     *
     * Chong trung theo `(kenh_theo_doi_id, ma_bai)` — khoa GHEP chu khong phai
     * `ma_bai` don, vi hai nen tang khac nhau co the sinh ma trung nhau.
     *
     * Tra ve so dong THUC SU them moi, de nguoi goi bao "keo ve N bai moi" that
     * chu khong phai dem so bai actor tra ve.
     */
    async luuNhieu(bai: BaiGhiVao[]): Promise<number> {
      if (bai.length === 0) return 0;
      const dong = await db
        .insert(trendSignals)
        .values(
          bai.map((b) => ({
            workspaceId,
            kenhTheoDoiId: b.kenhTheoDoiId,
            nguon: b.nguon,
            maBai: b.maBai,
            tieuDe: dungTieuDe(b.noiDung),
            lienKet: b.lienKet,
            noiDung: b.noiDung,
            thoiDiem: b.thoiDiem,
            dangBai: b.dangBai,
            soThich: b.soThich,
            soBinhLuan: b.soBinhLuan,
            soChiaSe: b.soChiaSe,
            thoiLuongVideoMs: b.thoiLuongVideoMs,
            tho: b.tho as never,
          })),
        )
        .onConflictDoNothing({ target: [trendSignals.kenhTheoDoiId, trendSignals.maBai] })
        .returning({ id: trendSignals.id });
      return dong.length;
    },

    /**
     * Tin hieu cua cac kenh MOT NGUOI CU THE theo doi.
     *
     * Day la cho duy nhat truc co lap thu hai co hieu luc khi sinh y tuong. Bo
     * `innerJoin` voi `theo_doi_cua_toi` la B doc duoc tin hieu cua kenh A theo.
     */
    async theoNguoiDung(nguoi: NguoiDungTuPhien, gioiHan: number) {
      const dong = await db
        .select({ t: trendSignals, tenKenh: kenhTheoDoi.tenHienThi, urlKenh: kenhTheoDoi.urlKenh })
        .from(trendSignals)
        .innerJoin(kenhTheoDoi, eq(kenhTheoDoi.id, trendSignals.kenhTheoDoiId))
        .innerJoin(
          theoDoiCuaToi,
          and(
            eq(theoDoiCuaToi.kenhTheoDoiId, kenhTheoDoi.id),
            eq(theoDoiCuaToi.userId, nguoi.userId),
          ),
        )
        .where(and(eq(trendSignals.workspaceId, workspaceId), eq(trendSignals.daDung, false)))
        .orderBy(desc(trendSignals.thoiDiem))
        .limit(gioiHan);
      return dong.map((d) => ({ ...d.t, tenKenh: d.tenKenh, urlKenh: d.urlKenh }));
    },

    /**
     * MOI bai cua cac kenh mot nguoi cu the theo doi — cho man tra cuu.
     *
     * Khac `theoNguoiDung()` ngay tren o mot diem: KHONG loc `da_dung`. Ham kia
     * cap bai cho bo sinh y tuong nen phai bo bai da dung; man tra cuu thi
     * nguoc lai — bai da sinh thanh y tuong VAN phai tim lai duoc. Vi the la
     * ham rieng chu khong phai mot co tren ham cu: mot noi doc quyet dinh hanh
     * vi cua noi kia la cho bug sau nay.
     *
     * `innerJoin` voi `theo_doi_cua_toi` la truc co lap THU HAI. Bo no la B
     * doc duoc bai cua kenh A theo doi.
     */
    async theoNguoiDungDeTraCuu(nguoi: NguoiDungTuPhien, gioiHan: number) {
      return db
        .select({
          // Liet ke DUNG cot man hinh dung. `select` ca dong se keo theo `tho` —
          // ban thô nguyên văn cua Apify, moi muc co the vai chuc KB — cho 200
          // dong, moi lan tai trang, roi vut di. Be ket noi chi co 10 cho.
          id: trendSignals.id,
          maBai: trendSignals.maBai,
          thoiDiem: trendSignals.thoiDiem,
          noiDung: trendSignals.noiDung,
          dangBai: trendSignals.dangBai,
          lienKet: trendSignals.lienKet,
          soThich: trendSignals.soThich,
          soBinhLuan: trendSignals.soBinhLuan,
          soChiaSe: trendSignals.soChiaSe,
          thoiLuongVideoMs: trendSignals.thoiLuongVideoMs,
          tenKenh: kenhTheoDoi.tenHienThi,
          urlKenh: kenhTheoDoi.urlKenh,
        })
        .from(trendSignals)
        .innerJoin(kenhTheoDoi, eq(kenhTheoDoi.id, trendSignals.kenhTheoDoiId))
        .innerJoin(
          theoDoiCuaToi,
          and(
            eq(theoDoiCuaToi.kenhTheoDoiId, kenhTheoDoi.id),
            eq(theoDoiCuaToi.userId, nguoi.userId),
            // Thua ve mat dung dan (chuoi join da ep cung workspace) nhung chi
            // muc duy nhat cua bang nay la (workspace_id, user_id) — thieu cot
            // dan dau thi khong dung duoc chi muc.
            eq(theoDoiCuaToi.workspaceId, workspaceId),
          ),
        )
        .where(eq(trendSignals.workspaceId, workspaceId))
        // `nulls last` chu khong phai `desc` tran: Postgres xep NULL LEN DAU khi
        // giam dan, ma `thoi_diem` co that duong sinh null (`ngayAn()` tra null
        // khi khong doc duoc ngay). Mot me bai khong co ngay se chiem tron
        // `gioiHan` va day bai moi nhat ra khoi bang.
        .orderBy(sql`${trendSignals.thoiDiem} desc nulls last`)
        .limit(gioiHan);
    },

    /**
     * CHIEM cac bai chua boc cong thuc, roi THA KHOA NGAY.
     *
     * CO HAI DUONG cung goi boc: nut bam o man de xuat va viec chay theo lich.
     * Mot cau `where cong_thuc is null` tran thi ca hai cung chon dung mot bai
     * truoc khi ben nao ghi xong — tra tien mo hinh hai lan cho mot bai.
     *
     * VI SAO DANH DAU ROI THA CHU KHONG GIU GIAO DICH SUOT LUOT GOI MO HINH:
     * ban dau ham nay tra ve dong da khoa va de nguoi goi giu giao dich trong
     * suot luot goi mo hinh (tran 360 giay). Be ket noi chi co 10 cho — vai lan
     * bam cung luc la can be, keo sap moi truy van khac cua ca ung dung. Chiem
     * xong tha ngay thi khoa chi giu vai mili giay.
     *
     * Danh dau bang `cong_thuc = {}` (doi tuong rong): khac `NULL` nen lan chon
     * sau bo qua. Goi mo hinh hong thi nguoi goi PHAI goi `traLaiChuaBoc()`,
     * neu khong bai do mang co `{}` vinh vien va khong bao gio duoc boc nua.
     */
    async chiemBaiChuaBoc(gioiHan: number) {
      return db.transaction(async (tx) => {
        const dong = await tx
          .select()
          .from(trendSignals)
          .where(
            and(
              eq(trendSignals.workspaceId, workspaceId),
              isNull(trendSignals.congThuc),
              sql`${trendSignals.noiDung} is not null and ${trendSignals.noiDung} <> ''`,
            ),
          )
          .orderBy(desc(trendSignals.thoiDiem))
          .limit(gioiHan)
          .for('update', { skipLocked: true });

        if (dong.length > 0) {
          await tx
            .update(trendSignals)
            .set({ congThuc: {} as never })
            .where(
              and(
                eq(trendSignals.workspaceId, workspaceId),
                inArray(
                  trendSignals.id,
                  dong.map((d) => d.id),
                ),
              ),
            );
        }
        return dong;
      });
    },

    /** Tra bai ve trang thai chua boc khi luot goi mo hinh hong. */
    async traLaiChuaBoc(ids: string[]) {
      if (ids.length === 0) return;
      await db
        .update(trendSignals)
        .set({ congThuc: null })
        .where(and(eq(trendSignals.workspaceId, workspaceId), inArray(trendSignals.id, ids)));
    },

    async ghiCongThuc(id: string, congThuc: unknown) {
      await db
        .update(trendSignals)
        .set({ congThuc: congThuc as never })
        .where(and(eq(trendSignals.workspaceId, workspaceId), eq(trendSignals.id, id)));
    },

    /**
     * Tin hieu nay co thuoc workspace hien tai khong.
     *
     * Server action la mot endpoint HTTP binh thuong: `trendSignalId` di vong
     * qua trinh duyet roi quay lai, nen KHONG duoc tin. Moi truong khac cua y
     * tuong (tru cot, chan dung) deu duoc doi chieu lai theo TEN trong danh sach
     * cua chinh workspace; cot nay la ID nen phai kiem rieng.
     */
    async coThuocWorkspace(id: string): Promise<boolean> {
      const [dong] = await db
        .select({ id: trendSignals.id })
        .from(trendSignals)
        .where(and(eq(trendSignals.workspaceId, workspaceId), eq(trendSignals.id, id)))
        .limit(1);
      return dong !== undefined;
    },

    /** Cot `diem_lien_quan` co san tu Phase 3, gio moi co nguoi ghi vao. */
    async ghiDiemLienQuan(id: string, diem: number) {
      await db
        .update(trendSignals)
        .set({ diemLienQuan: diem })
        .where(and(eq(trendSignals.workspaceId, workspaceId), eq(trendSignals.id, id)));
    },

    /** Danh dau tin hieu da duoc dung sinh y, de lan bam sau uu tien bai chua khai thac. */
    async danhDauDaDung(ids: string[]) {
      if (ids.length === 0) return;
      await db
        .update(trendSignals)
        .set({ daDung: true })
        .where(and(eq(trendSignals.workspaceId, workspaceId), inArray(trendSignals.id, ids)));
    },
  };
}
