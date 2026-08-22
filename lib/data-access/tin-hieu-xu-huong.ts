/**
 * Repo bảng `trend_signals` — một bài của kênh ngoài đã kéo về.
 *
 * Bảng này có từ Phase 3 nhưng không ai dùng. Mở rộng nó thay vì tạo bảng mới
 * vì `ideas.trend_signal_id` đã trỏ vào đây: tạo bảng mới là để bảng này chết
 * vĩnh viễn VÀ phải thêm khóa ngoại thứ hai lên `ideas`.
 */

import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { kenhTheoDoi, theoDoiCuaToi, trendSignals } from '@/db/schema/index';

import type { KetNoiDrizzle, NguoiDungTuPhien } from './guard';

export type TinHieuXuHuong = typeof trendSignals.$inferSelect;

/** Một bài kênh ngoài chuẩn bị ghi. `null` ở cột số liệu = KHÔNG ĐO ĐƯỢC, khác 0. */
export type BaiGhiVao = {
  kenhTheoDoiId    : string;
  nguon            : string;
  maBai            : string;
  lienKet          : string | null;
  noiDung          : string;
  thoiDiem         : Date | null;
  dangBai          : TinHieuXuHuong['dangBai'];
  soThich          : number | null;
  soBinhLuan       : number | null;
  soChiaSe         : number | null;
  thoiLuongVideoMs : number | null;
  tho              : unknown;
};

/** `tieu_de` là NOT NULL từ Phase 3 — dùng dòng đầu của nội dung làm tiêu đề. */
function dungTieuDe(noiDung: string): string {
  const dongDau = noiDung.split('\n').find((d) => d.trim() !== '');
  if (!dongDau) return '(khong co chu)';
  const sach = dongDau.trim();
  return sach.length > 200 ? `${sach.slice(0, 197)}...` : sach;
}

export function tinHieuXuHuongRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    /**
     * Ghi nhiều bài, bỏ qua bài đã có.
     *
     * Chống trùng theo `(kenh_theo_doi_id, ma_bai)` — khóa GHÉP chứ không phải
     * `ma_bai` đơn, vì hai nền tảng khác nhau có thể sinh mã trùng nhau.
     *
     * Trả về số dòng THỰC SỰ thêm mới, để người gọi báo "kéo về N bài mới" thật
     * chứ không phải đếm số bài actor trả về.
     */
    async luuNhieu(bai: BaiGhiVao[]): Promise<number> {
      if (bai.length === 0) return 0;
      const dong = await db
        .insert(trendSignals)
        .values(
          bai.map((b) => ({
            workspaceId,
            kenhTheoDoiId    : b.kenhTheoDoiId,
            nguon            : b.nguon,
            maBai            : b.maBai,
            tieuDe           : dungTieuDe(b.noiDung),
            lienKet          : b.lienKet,
            noiDung          : b.noiDung,
            thoiDiem         : b.thoiDiem,
            dangBai          : b.dangBai,
            soThich          : b.soThich,
            soBinhLuan       : b.soBinhLuan,
            soChiaSe         : b.soChiaSe,
            thoiLuongVideoMs : b.thoiLuongVideoMs,
            tho              : b.tho as never,
          })),
        )
        .onConflictDoNothing({ target: [trendSignals.kenhTheoDoiId, trendSignals.maBai] })
        .returning({ id: trendSignals.id });
      return dong.length;
    },

    /**
     * Tín hiệu của các kênh MỘT NGƯỜI CỤ THỂ theo dõi.
     *
     * Đây là chỗ duy nhất trục cô lập thứ hai có hiệu lực khi sinh ý tưởng. Bỏ
     * `innerJoin` với `theo_doi_cua_toi` là B đọc được tín hiệu của kênh A theo.
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
        .orderBy(desc(trendSignals.thoiDiem), desc(trendSignals.id))
        .limit(gioiHan);
      return dong.map((d) => ({ ...d.t, tenKenh: d.tenKenh, urlKenh: d.urlKenh }));
    },

    /**
     * MỌI bài của các kênh một người cụ thể theo dõi — cho màn tra cứu.
     *
     * Khác `theoNguoiDung()` ngay trên ở một điểm: KHÔNG lọc `da_dung`. Hàm kia
     * cấp bài cho bộ sinh ý tưởng nên phải bỏ bài đã dùng; màn tra cứu thì
     * ngược lại — bài đã sinh thành ý tưởng VẪN phải tìm lại được. Vì thế là
     * hàm riêng chứ không phải một cờ trên hàm cũ: một nơi đọc quyết định hành
     * vi của nơi kia là chỗ cho bug sau này.
     *
     * `innerJoin` với `theo_doi_cua_toi` là trục cô lập THỨ HAI. Bỏ nó là B
     * đọc được bài của kênh A theo dõi.
     */
    async theoNguoiDungDeTraCuu(nguoi: NguoiDungTuPhien, gioiHan: number) {
      return db
        .select({
          // Liệt kê ĐÚNG cột màn hình dùng. `select` cả dòng sẽ kéo theo `tho` —
          // bản thô nguyên văn của Apify, mỗi mục có thể vài chục KB — cho 200
          // dòng, mỗi lần tải trang, rồi vứt đi. Bể kết nối chỉ có 10 chỗ.
          id               : trendSignals.id,
          maBai            : trendSignals.maBai,
          thoiDiem         : trendSignals.thoiDiem,
          noiDung          : trendSignals.noiDung,
          dangBai          : trendSignals.dangBai,
          lienKet          : trendSignals.lienKet,
          soThich          : trendSignals.soThich,
          soBinhLuan       : trendSignals.soBinhLuan,
          soChiaSe         : trendSignals.soChiaSe,
          thoiLuongVideoMs : trendSignals.thoiLuongVideoMs,
          tenKenh          : kenhTheoDoi.tenHienThi,
          urlKenh          : kenhTheoDoi.urlKenh,
        })
        .from(trendSignals)
        .innerJoin(kenhTheoDoi, eq(kenhTheoDoi.id, trendSignals.kenhTheoDoiId))
        .innerJoin(
          theoDoiCuaToi,
          and(
            eq(theoDoiCuaToi.kenhTheoDoiId, kenhTheoDoi.id),
            eq(theoDoiCuaToi.userId, nguoi.userId),
            // Thừa về mặt đúng đắn (chuỗi join đã ép cùng workspace) nhưng chỉ
            // mục duy nhất của bảng này là (workspace_id, user_id) — thiếu cột
            // dẫn đầu thì không dùng được chỉ mục.
            eq(theoDoiCuaToi.workspaceId, workspaceId),
          ),
        )
        .where(eq(trendSignals.workspaceId, workspaceId))
        // `nulls last` chứ không phải `desc` trần: Postgres xếp NULL LÊN ĐẦU khi
        // giảm dần, mà `thoi_diem` có thật đường sinh null (`ngayAn()` trả null
        // khi không đọc được ngày). Một mẻ bài không có ngày sẽ chiếm trọn
        // `gioiHan` và đẩy bài mới nhất ra khỏi bảng.
        .orderBy(sql`${trendSignals.thoiDiem} desc nulls last`)
        .limit(gioiHan);
    },

    /**
     * CHIẾM các bài chưa bóc công thức, rồi THẢ KHÓA NGAY.
     *
     * CÓ HAI ĐƯỜNG cùng gọi bóc: nút bấm ở màn đề xuất và việc chạy theo lịch.
     * Một câu `where cong_thuc is null` trần thì cả hai cùng chọn đúng một bài
     * trước khi bên nào ghi xong — trả tiền mô hình hai lần cho một bài.
     *
     * VÌ SAO ĐÁNH DẤU RỒI THẢ CHỨ KHÔNG GIỮ GIAO DỊCH SUỐT LƯỢT GỌI MÔ HÌNH:
     * ban đầu hàm này trả về dòng đã khóa và để người gọi giữ giao dịch trong
     * suốt lượt gọi mô hình (trần 360 giây). Bể kết nối chỉ có 10 chỗ — vài lần
     * bấm cùng lúc là cạn bể, kéo sập mọi truy vấn khác của cả ứng dụng. Chiếm
     * xong thả ngay thì khóa chỉ giữ vài mili giây.
     *
     * Đánh dấu bằng `cong_thuc = {}` (đối tượng rỗng): khác `NULL` nên lần chọn
     * sau bỏ qua. Gọi mô hình hỏng thì người gọi PHẢI gọi `traLaiChuaBoc()`,
     * nếu không bài đó mang cờ `{}` vĩnh viễn và không bao giờ được bóc nữa.
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

    /** Trả bài về trạng thái chưa bóc khi lượt gọi mô hình hỏng. */
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
     * Tín hiệu này có thuộc workspace hiện tại không.
     *
     * Server action là một endpoint HTTP bình thường: `trendSignalId` đi vòng
     * qua trình duyệt rồi quay lại, nên KHÔNG được tin. Mọi trường khác của ý
     * tưởng (trụ cột, chân dung) đều được đối chiếu lại theo TÊN trong danh sách
     * của chính workspace; cột này là ID nên phải kiểm riêng.
     */
    async coThuocWorkspace(id: string): Promise<boolean> {
      const [dong] = await db
        .select({ id: trendSignals.id })
        .from(trendSignals)
        .where(and(eq(trendSignals.workspaceId, workspaceId), eq(trendSignals.id, id)))
        .limit(1);
      return dong !== undefined;
    },

    /** Cột `diem_lien_quan` có sẵn từ Phase 3, giờ mới có người ghi vào. */
    async ghiDiemLienQuan(id: string, diem: number) {
      await db
        .update(trendSignals)
        .set({ diemLienQuan: diem })
        .where(and(eq(trendSignals.workspaceId, workspaceId), eq(trendSignals.id, id)));
    },

    /** Đánh dấu tín hiệu đã được dùng sinh ý, để lần bấm sau ưu tiên bài chưa khai thác. */
    async danhDauDaDung(ids: string[]) {
      if (ids.length === 0) return;
      await db
        .update(trendSignals)
        .set({ daDung: true })
        .where(and(eq(trendSignals.workspaceId, workspaceId), inArray(trendSignals.id, ids)));
    },
  };
}
