/**
 * Nhom van hanh — Phu luc B muc 3.6.
 *
 * File nay CHI duoc import tu `auth.ts`. `model_runs.content_id` va
 * `jobs.du_lieu_vao` co tro toi noi dung nhung khong dat khoa ngoai: nhat ky
 * chay mo hinh va so ke chi phi phai song sot khi mot noi dung bi xoa, va giu
 * huong phu thuoc mot chieu (ops -> auth) de cac file schema khong tao vong.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { capNhat, idUuid, khoaWorkspace, ngayTao, type Jsonb } from './auth';

/** Phu luc B muc 6.1 — moi loai viec ung voi mot worker cu the. */
export const loaiViec = pgEnum('loai_viec', [
  'sinh-y-tuong',
  'sinh-bai',
  'sinh-kich-ban',
  'cham-chat-luong',
  'boc-tach-ho-so',
  'sinh-anh',
  'kiem-tra-lien-ket',
  'keo-so-lieu-lo',
  'quet-xu-huong',
  'phan-loai-binh-luan',
  'tinh-diem-hieu-qua',
  'tong-hop-tuan',
]);

export const trangThaiJob = pgEnum('trang_thai_job', [
  'cho',
  'dang_chay',
  'xong',
  'loi',
  'huy',
]);

/** PRD muc 8.2 — danh sach nhiem vu ma lop truu tuong goi mo hinh nhan. */
export const nhiemVuMoHinh = pgEnum('nhiem_vu_mo_hinh', [
  'viet-bai',
  'viet-kich-ban',
  'de-xuat-y-tuong',
  'cham-chat-luong',
  'phan-loai-binh-luan',
  'boc-tach-ho-so',
  'cham-diem-lien-quan',
  'sinh-anh',
]);

export const loaiChiPhi = pgEnum('loai_chi_phi', [
  'goi-mo-hinh',
  'sinh-anh',
  'apify',
  'luu-tru',
  'khac',
]);

export const jobs = pgTable(
  'jobs',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    loaiViec: loaiViec('loai_viec').notNull(),
    duLieuVao: jsonb('du_lieu_vao').$type<Jsonb>().notNull().default({}),
    trangThai: trangThaiJob('trang_thai').notNull().default('cho'),
    soLanThu: integer('so_lan_thu').notNull().default(0),
    /**
     * Apify tinh tien theo luot chay, nen moi viec keo so lieu phai co khoa
     * `content_id + moc`. Chan trung o tang CSDL, khong chan bang if trong code.
     * De NULL cho cac viec khong can chong trung (PostgreSQL cho nhieu NULL
     * trong mot khoa duy nhat).
     */
    idempotencyKey: text('idempotency_key'),
    thoiDiemChay: timestamp('thoi_diem_chay', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lockedBy: text('locked_by'),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    loi: text('loi'),
    ketQua: jsonb('ket_qua').$type<Jsonb>(),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [
    unique('jobs_idempotency_key_key').on(t.idempotencyKey),
    // Worker lay viec bang SELECT ... FOR UPDATE SKIP LOCKED tren dung hai cot nay.
    index('jobs_trang_thai_thoi_diem_chay_idx').on(t.trangThai, t.thoiDiemChay),
    index('jobs_locked_at_idx').on(t.lockedAt),
    index('jobs_workspace_id_idx').on(t.workspaceId),
  ],
);

export const modelRuns = pgTable(
  'model_runs',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    nhiemVu: nhiemVuMoHinh('nhiem_vu').notNull(),
    // Ten mo hinh doi lien tuc (claude-cli, codex-cli, ban API sau nay) nen de
    // text: them mot mo hinh khong duoc keo theo mot lan chuyen doi luoc do.
    moHinh: text('mo_hinh').notNull(),
    doDaiVao: integer('do_dai_vao'),
    doDaiRa: integer('do_dai_ra'),
    thoiGianChayMs: integer('thoi_gian_chay_ms'),
    thanhCong: boolean('thanh_cong').notNull(),
    loi: text('loi'),
    contentId: uuid('content_id'),
    ngayTao: ngayTao(),
  },
  (t) => [
    index('model_runs_workspace_ngay_tao_idx').on(t.workspaceId, t.ngayTao),
    index('model_runs_content_id_idx').on(t.contentId),
  ],
);

/**
 * PRD muc 12.3: nhat ky chi phi theo tung nguoi dung phai co tu V1 du V1 chi co
 * mot nguoi dung — day la can cu duy nhat de dat gia ban ma khong lo.
 */
export const costLog = pgTable(
  'cost_log',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    loaiChiPhi: loaiChiPhi('loai_chi_phi').notNull(),
    soLuong: numeric('so_luong', { precision: 12, scale: 4 }).notNull(),
    chiPhiUocTinh: numeric('chi_phi_uoc_tinh', { precision: 12, scale: 4 }).notNull(),
    donViTien: text('don_vi_tien').notNull().default('VND'),
    modelRunId: uuid('model_run_id').references(() => modelRuns.id, {
      onDelete: 'set null',
    }),
    ghiChu: text('ghi_chu'),
    ngay: timestamp('ngay', { withTimezone: true }).notNull().defaultNow(),
    ngayTao: ngayTao(),
  },
  (t) => [index('cost_log_workspace_ngay_idx').on(t.workspaceId, t.ngay)],
);

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    bienDongLuot: integer('bien_dong_luot').notNull(),
    lyDo: text('ly_do').notNull(),
    soDuSau: integer('so_du_sau').notNull(),
    ngayTao: ngayTao(),
  },
  (t) => [index('credit_ledger_workspace_ngay_tao_idx').on(t.workspaceId, t.ngayTao)],
);
