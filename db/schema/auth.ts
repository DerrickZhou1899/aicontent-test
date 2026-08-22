/**
 * Nhom tai khoan & phien dang nhap — Phu luc B muc 3.2.
 *
 * Bon bang `users` / `oauth_accounts` / `sessions` / `verification_tokens` do
 * @auth/drizzle-adapter dieu khien. Adapter truy cap cot qua TEN THUOC TINH
 * TypeScript (users.emailVerified, oauthAccounts.providerAccountId...), khong
 * qua ten cot SQL — nen ten cot duoi CSDL de snake_case tieng Viet cho dong bo,
 * con ten thuoc tinh TS giu nguyen theo dac ta Auth.js. Doi ten thuoc tinh TS la
 * adapter gay im lang: Phase 6 phai truyen 4 bang nay vao DrizzleAdapter().
 */

import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Manh ghep dung lai o moi file schema. Dat o day vi `khoaWorkspace` phai tro
// toi `workspaces` — de o file rieng se tao phu thuoc vong giua cac file schema.
// ---------------------------------------------------------------------------

/** Khoa chinh dong nhat toan he thong: uuid sinh boi gen_random_uuid() (pgcrypto). */
export const idUuid = () => uuid('id').primaryKey().defaultRandom();

/** Moc thoi gian luu theo gio chuan quoc te, hien thi gio Viet Nam o tang giao dien. */
export const ngayTao = () =>
  timestamp('ngay_tao', { withTimezone: true }).notNull().defaultNow();

export const capNhat = () =>
  timestamp('cap_nhat', { withTimezone: true }).notNull().defaultNow();

/**
 * Moi bang nghiep vu deu phai co cot nay — la neo cho tang truy cap du lieu
 * (Phase 5) va cho phan quyen theo hang cua PostgreSQL (Phase 13).
 */
export const khoaWorkspace = () =>
  uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' });

export const vaiTroThanhVien = pgEnum('vai_tro_thanh_vien', [
  'chu_so_huu',
  'thanh_vien',
  'quan_tri_he_thong',
]);

// ---------------------------------------------------------------------------
// Bang do Auth.js quan
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: idUuid(),
  name: text('ten'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_xac_thuc_luc', { withTimezone: true }),
  image: text('anh'),
  ngayTao: ngayTao(),
  // Phu luc B 3.2 yeu cau "lan dang nhap cuoi" de biet tai khoan nao con dung.
  lanDangNhapCuoi: timestamp('lan_dang_nhap_cuoi', { withTimezone: true }),
});

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: idUuid(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('loai').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    ngayTao: ngayTao(),
  },
  (t) => [
    // Email Google doi duoc, `sub` (provider_account_id) thi khong. Khoa duy nhat
    // dat o day, TUYET DOI khong dat tren email — dat tren email la khoa tai khoan
    // cua nguoi dung ngay lan ho doi dia chi Gmail.
    unique('oauth_accounts_provider_tai_khoan_key').on(t.provider, t.providerAccountId),
    index('oauth_accounts_user_id_idx').on(t.userId),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: idUuid(),
    sessionToken: text('session_token').notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
    // Phu luc B 3.2: "dau vet thiet bi" — de nguoi dung nhan ra phien la cua ai
    // truoc khi thu hoi.
    dauVetThietBi: text('dau_vet_thiet_bi'),
    ngayTao: ngayTao(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

/**
 * Chua dung o V1 (chi dang nhap Google, khong co lien ket ma thuat), nhung
 * adapter kiem tra bang nay khi khoi tao nen dinh nghia san.
 */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---------------------------------------------------------------------------
// Khong gian lam viec
// ---------------------------------------------------------------------------

export const workspaces = pgTable('workspaces', {
  id: idUuid(),
  ten: text('ten').notNull(),
  chuSoHuuId: uuid('chu_so_huu_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  ngonNgu: text('ngon_ngu').notNull().default('vi'),
  muiGio: text('mui_gio').notNull().default('Asia/Ho_Chi_Minh'),
  ngayTao: ngayTao(),
  capNhat: capNhat(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vaiTro: vaiTroThanhVien('vai_tro').notNull().default('thanh_vien'),
    ngayTao: ngayTao(),
  },
  (t) => [
    unique('workspace_members_workspace_user_key').on(t.workspaceId, t.userId),
    index('workspace_members_user_id_idx').on(t.userId),
  ],
);

/** Dung cho cac cot jsonb chua co cau truc chot — tranh `any` ra khap noi. */
export type Jsonb = Record<string, unknown>;
