/**
 * Nhom do luong — Phu luc B muc 3.5.
 *
 * Quyet dinh nen cua ca nhom: SO LIEU THO LA BAT BIEN. Moi luot keo ghi mot
 * ban chup moi kem `raw_payload` nguyen van; diem so nam o bang rieng, gan
 * `formula_version`, tinh lai duoc bat cu luc nao. Ghi de so lieu la bien toan
 * bo lich su thanh rac ngay lan dau doi cong thuc.
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { idUuid, khoaWorkspace, ngayTao, type Jsonb } from './auth';
import { contentPillars, personas } from './brand';
import { beMat, contents, dangBai } from './content';
import { modelRuns } from './ops';

/** Lich keo cua Phu luc A muc 8. Khoa chong trung cua job la content_id + moc. */
export const mocDoLuong = pgEnum('moc_do_luong', [
  'kiem_tra',
  't_24_gio',
  't_7_ngay',
  't_30_ngay',
]);

export const nguonSoLieu = pgEnum('nguon_so_lieu', ['apify', 'manual']);

/**
 * Phu luc A muc 8.1 — bon trang thai phai phan biet ro.
 * `khong_do_duoc` (bai de che do ban be, bai bi xoa, nen tang khong cho lay)
 * TUYET DOI khong duoc quy ve 0 diem: cham 0 lam he thong tuong ca tuyen noi
 * dung do vo dung roi ngung de xuat, va khong ai phat hien cho toi khi kenh da
 * lech huong ca thang.
 */
export const trangThaiSnapshot = pgEnum('trang_thai_snapshot', [
  'co_du_lieu',
  'khong_do_duoc',
  'loi',
  'chua_toi_han',
]);

/** PRD muc 5.2 — thang diem y dinh: mua 10, quan tam 3, xa giao 1, rac 0. */
export const nhomYDinh = pgEnum('nhom_y_dinh', ['mua', 'quan_tam', 'xa_giao', 'rac']);

export const metricSnapshots = pgTable(
  'metric_snapshots',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    contentId: uuid('content_id').notNull(),
    /**
     * Ghim be mat TAI THOI DIEM DO, khong suy ra tu `contents` luc tinh lai.
     * Suy ra thi sua `contents.be_mat` la gan lai toan bo lich su do luong sang
     * be mat khac — bon be mat do bang cong thuc khac nhau nen so lieu thanh vo
     * nghia ma khong co dau hieu nao.
     */
    beMat: beMat('be_mat').notNull(),
    moc: mocDoLuong('moc').notNull(),
    thoiDiemKeo: timestamp('thoi_diem_keo', { withTimezone: true }).notNull().defaultNow(),
    nguon: nguonSoLieu('nguon').notNull(),
    thich: integer('thich'),
    binhLuan: integer('binh_luan'),
    chiaSe: integer('chia_se'),
    luu: integer('luu'),
    luotXem: integer('luot_xem'),
    // Zalo khong keo tu dong duoc — o nay la nguon so lieu duy nhat cua be mat do.
    tinNhanHoi: integer('tin_nhan_hoi'),
    /**
     * Du lieu tho nguyen van tu Apify, khong boc truong, khong don dep. Khi bo
     * boc truong hong thi viet lai roi chay lai toan bo lich su tu cot nay.
     * Chi INSERT ban chup moi, khong bao gio UPDATE.
     */
    rawPayload: jsonb('raw_payload').$type<Jsonb>().notNull(),
    status: trangThaiSnapshot('status').notNull(),
    phienBanTrinhThuThap: text('phien_ban_trinh_thu_thap'),
    loi: text('loi'),
    ngayTao: ngayTao(),
  },
  (t) => [
    // UNIQUE chứ không phải index thường: đây là TẦNG GIỮ TIỀN. Apify tính tiền
    // theo lượt chạy, ghi 2 snapshot cho cùng bài cùng mốc là vừa mất tiền vừa
    // làm bẩn trung vị. Phase 14 có tiêu chí nghiệm thu "chạy lại cùng
    // content_id + moc → bị chặn ở tầng database" — chặn ở tầng ứng dụng không đủ.
    unique('metric_snapshots_content_moc_key').on(t.contentId, t.moc),
    index('metric_snapshots_workspace_thoi_diem_idx').on(t.workspaceId, t.thoiDiemKeo),
    index('metric_snapshots_status_idx').on(t.status),
    /**
     * Khoa ngoai GHEP thay cho khoa ngoai roi tren mot minh `content_id`. Ghep
     * ca `workspace_id` va `be_mat` vao thi CSDL ep luon hai dieu: ban chup phai
     * cung workspace voi bai, va be mat da ghim khong lech duoc voi bai.
     *
     * Khong con `cascade`: so lieu tho la bat bien, nen xoa cung mot bai da co
     * ban chup la LOI. Luong bo bai dung la `contents.trang_thai = 'da_bo'` kem
     * `ly_do_bo` (Phu luc A muc 4.1).
     *
     * `no action` chu khong phai `restrict` — khac biet duy nhat la thoi diem
     * kiem: `restrict` kiem ngay tung dong, `no action` kiem o cuoi cau lenh.
     * Xoa ca mot workspace la day chuyen xuong CA `contents` lan `metric_snapshots`
     * trong cung mot cau lenh; voi `restrict` thi viec go mot khach hang song hay
     * chet phu thuoc vao thu tu PostgreSQL chay hai day chuyen do. Da thu that
     * tren dev: thu tu hien tai may man dung. Khong dua he thong vao chuyen may man.
     */
    foreignKey({
      columns: [t.workspaceId, t.contentId, t.beMat],
      foreignColumns: [contents.workspaceId, contents.id, contents.beMat],
      name: 'metric_snapshots_content_fk',
    }),
    // Hai UNIQUE duoi day khong phuc vu truy van nao — chung la be do cho khoa
    // ngoai ghep cua `effectiveness_scores`.
    unique('metric_snapshots_workspace_id_status_key').on(
      t.workspaceId,
      t.id,
      t.status,
    ),
    unique('metric_snapshots_content_id_key').on(t.contentId, t.id),
  ],
);

export const commentsRaw = pgTable(
  'comments_raw',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    snapshotId: uuid('snapshot_id')
      .notNull()
      .references(() => metricSnapshots.id, { onDelete: 'cascade' }),
    // Ma binh luan tren nen tang — de khong dem trung mot binh luan qua nhieu
    // lan keo cua cung mot bai.
    maBinhLuan: text('ma_binh_luan'),
    noiDung: text('noi_dung').notNull(),
    // An danh hoa truoc khi luu: he thong khong can biet ai binh luan, chi can
    // biet co bao nhieu nguoi khac nhau.
    tacGiaAnDanh: text('tac_gia_an_danh'),
    thoiDiem: timestamp('thoi_diem', { withTimezone: true }),
    ngayTao: ngayTao(),
  },
  (t) => [
    index('comments_raw_content_id_idx').on(t.contentId),
    index('comments_raw_snapshot_id_idx').on(t.snapshotId),
    unique('comments_raw_content_ma_binh_luan_key').on(t.contentId, t.maBinhLuan),
  ],
);

export const commentClassifications = pgTable(
  'comment_classifications',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    commentId: uuid('comment_id')
      .notNull()
      .references(() => commentsRaw.id, { onDelete: 'cascade' }),
    nhomYDinh: nhomYDinh('nhom_y_dinh').notNull(),
    diem: integer('diem').notNull(),
    modelRunId: uuid('model_run_id').references(() => modelRuns.id, {
      onDelete: 'set null',
    }),
    phienBanBoPhanLoai: integer('phien_ban_bo_phan_loai').notNull().default(1),
    ngayTao: ngayTao(),
  },
  (t) => [
    unique('comment_classifications_comment_phien_ban_key').on(
      t.commentId,
      t.phienBanBoPhanLoai,
    ),
    index('comment_classifications_nhom_y_dinh_idx').on(t.workspaceId, t.nhomYDinh),
  ],
);

/**
 * Chi sinh dong o day khi `metric_snapshots.status = 'co_du_lieu'` — va dieu do
 * duoc CSDL EP, khong phai chi ghi trong comment.
 *
 * Cach ep: mang theo cot `snapshot_status` roi rang lai vao ban chup bang khoa
 * ngoai ghep. `CHECK` cua PostgreSQL khong doc duoc bang khac nen day la cach
 * duy nhat lam duoc o tang CSDL. Cham 0 diem cho bai `khong_do_duoc` la cach
 * nhanh nhat lam hong toan bo viec hoc: he thong tuong ca tuyen noi dung do vo
 * dung roi ngung de xuat, khong ai phat hien cho toi khi kenh da lech ca thang.
 */
export const effectivenessScores = pgTable(
  'effectiveness_scores',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    contentId: uuid('content_id').notNull(),
    snapshotId: uuid('snapshot_id').notNull(),
    /**
     * Lap lai `metric_snapshots.status` co chu y. Khong lech duoc: khoa ngoai
     * ghep ben duoi rang cot nay vao dung trang thai that cua ban chup.
     */
    snapshotStatus: trangThaiSnapshot('snapshot_status').notNull(),
    // Cong thuc trong so chac chan se doi sau 1-2 thang dung that. Co cot nay
    // thi doi cong thuc chi la chay lai lenh tinh diem, giu ca diem cu de so.
    formulaVersion: integer('formula_version').notNull(),
    diemThanhPhan: jsonb('diem_thanh_phan').$type<Jsonb>().notNull(),
    diemTongChuanHoa: doublePrecision('diem_tong_chuan_hoa'),
    // So voi trung vi 20 bai gan nhat cung workspace + cung be mat (±%).
    soTrungVi: doublePrecision('so_trung_vi'),
    xepHangTrongTuan: integer('xep_hang_trong_tuan'),
    tuanBatDau: date('tuan_bat_dau'),
    // Chua du 20 bai de lay trung vi thi van tinh diem nhung phai danh dau de
    // giao dien noi ro "do tin cay thap".
    doTinCayThap: boolean('do_tin_cay_thap').notNull().default(false),
    ngayTao: ngayTao(),
  },
  (t) => [
    unique('effectiveness_scores_snapshot_formula_key').on(t.snapshotId, t.formulaVersion),
    index('effectiveness_scores_content_id_idx').on(t.contentId),
    index('effectiveness_scores_workspace_tuan_idx').on(t.workspaceId, t.tuanBatDau),
    // Chi ban chup `co_du_lieu` moi duoc cham diem.
    check(
      'effectiveness_scores_chi_cham_ban_do_duoc',
      sql`${t.snapshotStatus} = 'co_du_lieu'`,
    ),
    /**
     * Ghep `workspace_id` + `snapshot_status` vao mot khoa ngoai: diem phai cung
     * workspace voi ban chup, VA trang thai mang theo phai dung trang thai that.
     * Khong co `ON UPDATE CASCADE` la co y — doi `status` cua ban chup da cham
     * diem cung bi chan, nen khong lach duoc bang cach cham diem truoc roi doi
     * trang thai sau.
     */
    foreignKey({
      columns: [t.workspaceId, t.snapshotId, t.snapshotStatus],
      foreignColumns: [
        metricSnapshots.workspaceId,
        metricSnapshots.id,
        metricSnapshots.status,
      ],
      name: 'effectiveness_scores_snapshot_fk',
    }),
    /**
     * Diem va ban chup phai cung mot bai. Thieu rang buoc nay thi ghi duoc diem
     * cua bai A gan vao ban chup cua bai B — trung vi 20 bai gan nhat thanh rac
     * ma khong co trieu chung nao. `content_id` dung workspace theo bac cau qua
     * khoa ngoai ghep cua `metric_snapshots`, nen khong can them khoa ngoai roi
     * tro thang toi `contents`.
     */
    foreignKey({
      columns: [t.contentId, t.snapshotId],
      foreignColumns: [metricSnapshots.contentId, metricSnapshots.id],
      name: 'effectiveness_scores_content_fk',
    }),
  ],
);

export const pillarStats = pgTable(
  'pillar_stats',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    pillarId: uuid('pillar_id')
      .notNull()
      .references(() => contentPillars.id, { onDelete: 'cascade' }),
    beMat: beMat('be_mat').notNull(),
    // PRD 5.5 tổng hợp theo ĐỦ 5 chiều: trụ cột, dạng bài, góc tiếp cận,
    // chân dung nhắm tới, bề mặt đăng. Thiếu 3 chiều dưới đây thì Phase 15 không
    // sinh được bảng hiệu quả và phải phá băng schema — đúng thứ Phase 3 sinh ra
    // để tránh. Cho phép NULL: nghĩa là "tổng hợp gộp cả chiều này".
    dangBai: dangBai('dang_bai'),
    gocTiepCan: text('goc_tiep_can'),
    personaId: uuid('persona_id').references(() => personas.id, { onDelete: 'set null' }),
    kyBatDau: date('ky_bat_dau').notNull(),
    kyKetThuc: date('ky_ket_thuc').notNull(),
    // PRD 5.5 lan can 1: duoi 5 bai da co ket qua thi khong ket luan gi ve tuyen do.
    soBaiDuMau: integer('so_bai_du_mau').notNull().default(0),
    diemTrungBinh: doublePrecision('diem_trung_binh'),
    formulaVersion: integer('formula_version').notNull(),
    ngayTao: ngayTao(),
  },
  (t) => [
    // Phải gồm cả 5 chiều, nếu không hai dòng chỉ khác `dang_bai` sẽ đụng nhau.
    // `nullsNotDistinct`: PostgreSQL mặc định coi mỗi NULL là một giá trị khác
    // nhau, nên không có nó thì dòng "gộp cả chiều này" (NULL) ghi được vô số bản.
    unique('pillar_stats_ky_key')
      .on(t.workspaceId, t.pillarId, t.beMat, t.dangBai, t.gocTiepCan, t.personaId, t.kyBatDau)
      .nullsNotDistinct(),
  ],
);
