/**
 * Nhom bo nao kenh — Phu luc B muc 3.3.
 * Day la nguon du lieu cho moi lenh sinh noi dung: thieu du lieu o day thi may
 * de xuat khong co gi de bam vao (PRD F2: duoi 60% do day du thi chan de xuat).
 */

import { boolean, index, integer, jsonb, numeric, pgTable, text, unique } from 'drizzle-orm/pg-core';

import { capNhat, idUuid, khoaWorkspace, ngayTao } from './auth';

export const brandProfiles = pgTable(
  'brand_profiles',
  {
    id: idUuid(),
    // Moi khong gian lam viec chi co mot ho so thuong hieu — khoa duy nhat dat
    // trong danh sach rang buoc ben duoi.
    workspaceId: khoaWorkspace(),
    moTa: text('mo_ta'),
    giongDieu: text('giong_dieu'),
    dieuCamKy: text('dieu_cam_ky'),
    mauSac: jsonb('mau_sac').$type<string[]>(),
    phongChu: text('phong_chu'),
    // Chi bao "Do day du (%)" o PRD F2 — tinh lai moi lan luu ho so.
    doDayDu: integer('do_day_du').notNull().default(0),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [unique('brand_profiles_workspace_id_key').on(t.workspaceId)],
);

export const products = pgTable(
  'products',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    ten: text('ten').notNull(),
    gia: text('gia'),
    loiIch: text('loi_ich'),
    phanDoiThuongGap: text('phan_doi_thuong_gap'),
    loiKeuGoi: text('loi_keu_goi'),
    lienKet: text('lien_ket'),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [index('products_workspace_id_idx').on(t.workspaceId)],
);

export const personas = pgTable(
  'personas',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    ten: text('ten').notNull(),
    doTuoi: text('do_tuoi'),
    ngheNghiep: text('nghe_nghiep'),
    noiDau: text('noi_dau'),
    mongMuon: text('mong_muon'),
    cauNoiThuongDung: text('cau_noi_thuong_dung'),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [index('personas_workspace_id_idx').on(t.workspaceId)],
);

export const insights = pgTable(
  'insights',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    noiDung: text('noi_dung').notNull(),
    bangChung: text('bang_chung'),
    nguon: text('nguon'),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [index('insights_workspace_id_idx').on(t.workspaceId)],
);

export const contentPillars = pgTable(
  'content_pillars',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    ten: text('ten').notNull(),
    mucDich: text('muc_dich'),
    tiLeMucTieu: numeric('ti_le_muc_tieu', { precision: 5, scale: 2 }),
    // PRD 5.5 lan can 3: tru cot nuoi duong diem thap ngan han nhung la thu
    // khien bai chao ban chot duoc. May de xuat khong duoc tu ha ti le cua no.
    khoaKhongTuGiam: boolean('khoa_khong_tu_giam').notNull().default(false),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [index('content_pillars_workspace_id_idx').on(t.workspaceId)],
);
