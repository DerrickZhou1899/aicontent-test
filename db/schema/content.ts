/**
 * Nhom noi dung — Phu luc B muc 3.4 gop voi toan bo 7 nhom cot cua Phu luc A
 * muc 3. Phu luc B mo ta thieu 6 cot ma bang quan ly noi dung bat buoc phai co;
 * schema nay dong bang ca hai nguon de cac dot sau chi dung, khong sua.
 */

import { sql, type SQL } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
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

import { capNhat, idUuid, khoaWorkspace, ngayTao, users, type Jsonb } from './auth';
import { contentPillars, personas, products } from './brand';
import { modelRuns } from './ops';

/** PRD muc 2 — bon be mat dang, do bang cong thuc khac nhau, khong duoc gop. */
export const beMat = pgEnum('be_mat', ['fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo']);

/** Vong doi mot noi dung — Phu luc A muc 1. */
export const trangThaiNoiDung = pgEnum('trang_thai_noi_dung', [
  'y_tuong',
  'ban_nhap',
  'da_cham',
  'san_sang',
  'da_dang',
  'dang_theo_doi',
  'da_chot_ket_qua',
  'da_bo',
]);

/**
 * Khac `trang_thai` cua noi dung: day la trang thai duong ong do luong.
 * `loi_lien_ket` la bat buoc — Phu luc A muc 8 quy dinh trang thai nay khi keo
 * thu that bai, de nguoi dung biet ngay thay vi 7 ngay sau moi phat hien hong.
 */
export const trangThaiTheoDoi = pgEnum('trang_thai_theo_doi', [
  'chua_dang',
  'dang_theo_doi',
  'loi_lien_ket',
  'da_chot',
]);

export const dangBai = pgEnum('dang_bai', ['chu', 'anh_chu', 'kich_ban_quay']);

/** De tra loi: may de xuat hay nguoi tu nghi ra bai tot hon. */
export const nguonYTuong = pgEnum('nguon_y_tuong', [
  'may-de-xuat',
  'xu-huong',
  'nguoi-tu-nhap',
]);

/** Sau lua chon cua Phu luc A muc 4.1 — bat buoc chon mot khi bo bai. */
export const lyDoBo = pgEnum('ly_do_bo', [
  'khong_dung_giong',
  'sao_nhat',
  'sai_chan_dung',
  'trung_bai_da_dang',
  'khong_hop_be_mat',
  'thong_tin_sai',
]);

export const loaiAsset = pgEnum('loai_asset', ['anh', 'video', 'tep']);

/**
 * Hai trong ba actor Apify da chon nhan URL KENH (trang / ho so / tai khoan)
 * lam dau vao roi tu tim bai, khong nhan URL tung bai. Khong luu URL kenh thi
 * khoi keo so lieu khong chay duoc.
 */
export const kenhDang = pgTable(
  'kenh_dang',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    beMat: beMat('be_mat').notNull(),
    urlKenh: text('url_kenh').notNull(),
    tenHienThi: text('ten_hien_thi'),
    dangHoatDong: boolean('dang_hoat_dong').notNull().default(true),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [unique('kenh_dang_workspace_url_key').on(t.workspaceId, t.urlKenh)],
);

/**
 * Kenh CUA NGUOI KHAC ma workspace theo doi de hoc chu de va cach ke.
 *
 * VI SAO KHONG DUNG LAI `kenh_dang`: hai bang gan giong hinh dang nhung nguoc
 * nhau ve nghia. `kenhDangRepo.dat()` cuong che MOT be mat MOT kenh — dat lai la
 * SUA dong cu chu khong them dong moi. Danh sach theo doi can NHIEU kenh tren
 * cung mot be mat. Gop lai la pha quy tac do va sua moi noi dang dua vao no, de
 * doi lay viec bot mot bang 9 cot.
 *
 * Kho kenh la CUA CHUNG workspace: hai nguoi cung theo mot kenh thi chi keo MOT
 * luot. Ai theo doi cai nao thi nam o `theo_doi_cua_toi`.
 */
export const kenhTheoDoi = pgTable(
  'kenh_theo_doi',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    beMat: beMat('be_mat').notNull(),
    urlKenh: text('url_kenh').notNull(),
    tenHienThi: text('ten_hien_thi'),
    dangHoatDong: boolean('dang_hoat_dong').notNull().default(true),
    /** `null` = chua keo lan nao. Moc de tinh den han keo tiep. */
    lanKeoCuoi: timestamp('lan_keo_cuoi', { withTimezone: true }),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [unique('kenh_theo_doi_workspace_url_key').on(t.workspaceId, t.urlKenh)],
);

/**
 * Danh sach theo doi RIENG tung thanh vien.
 *
 * Day la truc co lap THU HAI cua he thong (truc thu nhat la `workspace_id`).
 * Y tuong buoi sang chi sinh tu kenh nguoi dang dang nhap theo doi, nen sai o
 * day nghia la B doc duoc tin hieu cua kenh A theo doi.
 */
export const theoDoiCuaToi = pgTable(
  'theo_doi_cua_toi',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kenhTheoDoiId: uuid('kenh_theo_doi_id')
      .notNull()
      .references(() => kenhTheoDoi.id, { onDelete: 'cascade' }),
    ngayTao: ngayTao(),
  },
  (t) => [
    unique('theo_doi_cua_toi_ws_user_kenh_key').on(t.workspaceId, t.userId, t.kenhTheoDoiId),
    index('theo_doi_cua_toi_ws_user_idx').on(t.workspaceId, t.userId),
  ],
);

/**
 * Mot bai cua kenh ngoai, hoac mot tin hieu xu huong khong gan kenh.
 *
 * BANG NAY CO TRUOC (Phase 3) nhung khong mã ứng dụng nao dung. Mo rong no thay
 * vi tao bang moi vi `ideas.trend_signal_id` da tro vao day roi — tao bang moi
 * nghia la de bang nay chet vinh vien VA phai them mot khoa ngoai thu hai len
 * `ideas`.
 *
 * `kenh_theo_doi_id` va `ma_bai` de NULLABLE co chu y: cac cot cu duoc thiet ke
 * cho tin hieu khong gan kenh (vi du "tuan nay nganh dang noi ve X"), chua dung
 * toi nhung khong sieu chat de con duong cho no.
 *
 * `so_thich` / `so_binh_luan` / `so_chia_se`: `null` = KHONG DO DUOC, khac han 0
 * = do duoc va bang khong. Bai hoc da tra gia o `lib/keo-bai/apify-ho-so-ca-nhan.ts`.
 */
export const trendSignals = pgTable(
  'trend_signals',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    nguon: text('nguon').notNull(),
    tieuDe: text('tieu_de').notNull(),
    lienKet: text('lien_ket'),
    thoiDiem: timestamp('thoi_diem', { withTimezone: true }),
    diemLienQuan: integer('diem_lien_quan'),
    daDung: boolean('da_dung').notNull().default(false),
    ngayTao: ngayTao(),

    kenhTheoDoiId: uuid('kenh_theo_doi_id').references(() => kenhTheoDoi.id, {
      onDelete: 'cascade',
    }),
    /** Ma bai theo nen tang. Ghep voi `kenh_theo_doi_id` thanh khoa chong trung. */
    maBai: text('ma_bai'),
    noiDung: text('noi_dung'),
    dangBai: dangBai('dang_bai'),
    soThich: integer('so_thich'),
    soBinhLuan: integer('so_binh_luan'),
    soChiaSe: integer('so_chia_se'),
    thoiLuongVideoMs: integer('thoi_luong_video_ms'),
    /** `null` = chua boc. Boc mot lan roi thoi, xem `lib/studio/boc-cong-thuc.ts`. */
    congThuc: jsonb('cong_thuc').$type<Jsonb>(),
    /** Ban tho nguyen van — dataset Apify bi xoa sau 7 ngay, khong luu la mat. */
    tho: jsonb('tho').$type<Jsonb>(),
  },
  (t) => [
    index('trend_signals_workspace_thoi_diem_idx').on(t.workspaceId, t.thoiDiem),
    unique('trend_signals_kenh_ma_bai_key').on(t.kenhTheoDoiId, t.maBai),
    index('trend_signals_kenh_thoi_diem_idx').on(t.workspaceId, t.kenhTheoDoiId, t.thoiDiem),
    // Chi muc RIENG PHAN cho vong boc cach ke: no chon `cong_thuc IS NULL` roi
    // sap theo `thoi_diem`. Chi muc chung o tren khong phuc vu duoc dieu kien
    // NULL. Rieng phan nen no chi to bang so bai CHUA boc — bai da boc xong roi
    // tu roi ra khoi chi muc.
    index('trend_signals_chua_boc_idx')
      .on(t.workspaceId, t.thoiDiem)
      .where(sql`${t.congThuc} is null`),
  ],
);

export const ideas = pgTable(
  'ideas',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    beMat: beMat('be_mat').notNull(),
    gocTiepCan: text('goc_tiep_can'),
    pillarId: uuid('pillar_id').references(() => contentPillars.id, {
      onDelete: 'set null',
    }),
    personaId: uuid('persona_id').references(() => personas.id, { onDelete: 'set null' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    cauMoDau: text('cau_mo_dau'),
    lyDoDeXuat: text('ly_do_de_xuat'),
    nguonYTuong: nguonYTuong('nguon_y_tuong').notNull().default('may-de-xuat'),
    trendSignalId: uuid('trend_signal_id').references(() => trendSignals.id, {
      onDelete: 'set null',
    }),
    modelRunId: uuid('model_run_id').references(() => modelRuns.id, {
      onDelete: 'set null',
    }),
    daDung: boolean('da_dung').notNull().default(false),
    ngayTao: ngayTao(),
  },
  (t) => [index('ideas_workspace_ngay_tao_idx').on(t.workspaceId, t.ngayTao)],
);

export const contents = pgTable(
  'contents',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    ideaId: uuid('idea_id').references(() => ideas.id, { onDelete: 'set null' }),
    // Mot noi dung dang len hai be mat = hai dong, noi voi nhau qua cot nay de
    // tra loi "cung noi dung, be mat nao cho ket qua tot hon".
    parentContentId: uuid('parent_content_id').references(
      (): AnyPgColumn => contents.id,
      { onDelete: 'set null' },
    ),
    kenhDangId: uuid('kenh_dang_id').references(() => kenhDang.id, {
      onDelete: 'set null',
    }),
    beMat: beMat('be_mat').notNull(),
    pillarId: uuid('pillar_id').references(() => contentPillars.id, {
      onDelete: 'set null',
    }),
    personaId: uuid('persona_id').references(() => personas.id, { onDelete: 'set null' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    gocTiepCan: text('goc_tiep_can'),
    dangBai: dangBai('dang_bai'),
    /**
     * Chuoi bai: nhieu bai noi tiep theo MOT MACH, khac han `parent_content_id`.
     *
     * Hai quan he nay bat buoc phai tach doi: `parent_content_id` noi cac ban
     * CUNG MOT NOI DUNG dang tren cac be mat khac nhau, va Phase 15 dua vao no
     * de tra loi "cung noi dung, be mat nao cho ket qua tot hon". Nhet chuoi bai
     * vao do la bai 1 va bai 2 cua mot chuoi bi dem nhu hai ban cua cung mot
     * noi dung — so lieu sai ma nhin bao cao khong the phat hien.
     *
     * `chuoi_id` la khoa nhom do ung dung sinh, KHONG tro vao bai dau chuoi:
     * xoa bai dau khong duoc lam ca chuoi mat lien ket.
     */
    chuoiId: uuid('chuoi_id'),
    thuTuTrongChuoi: integer('thu_tu_trong_chuoi'),
    nguonYTuong: nguonYTuong('nguon_y_tuong').notNull().default('may-de-xuat'),
    cauMoDau: text('cau_mo_dau'),
    noiDung: text('noi_dung'),
    // Cot suy ra tu noi dung — de CSDL tinh de khong bao gio lech voi noi dung that.
    soKyTu: integer('so_ky_tu').generatedAlwaysAs(
      (): SQL => sql`char_length(coalesce(noi_dung, ''))`,
    ),
    moHinhDaSinh: text('mo_hinh_da_sinh'),
    trangThai: trangThaiNoiDung('trang_thai').notNull().default('y_tuong'),
    nguoiTao: uuid('nguoi_tao').references(() => users.id, { onDelete: 'set null' }),
    ngayDuKienDang: timestamp('ngay_du_kien_dang', { withTimezone: true }),
    ngayDang: timestamp('ngay_dang', { withTimezone: true }),
    /**
     * Luu NGUYEN VAN lien ket nguoi dung dan vao, khong chuan hoa. Khi cach boc
     * ma bai hong (Facebook doi dang lien ket), viet lai bo boc roi chay lai
     * toan bo lich su. Bo cot nay de "gon" la mat kha nang sua sai ve sau.
     */
    lienKetGoc: text('lien_ket_goc'),
    /** Boc tu lien ket goc; cho NULL va cho nhap tay khi boc tu dong that bai. */
    maBai: text('ma_bai'),
    trangThaiTheoDoi: trangThaiTheoDoi('trang_thai_theo_doi')
      .notNull()
      .default('chua_dang'),
    // Phi chuan hoa co chu y: man hinh "Dang theo doi" phai liet ke hang tram
    // dong kem moc keo gan nhat; join max(thoi_diem_keo) cho tung dong la dat.
    lanKeoGanNhat: timestamp('lan_keo_gan_nhat', { withTimezone: true }),
    /** Quyet dinh co keo moc T+30 ngay hay khong (Phu luc A muc 8). */
    noiDungLauDai: boolean('noi_dung_lau_dai').notNull().default(false),
    nhanBanMauNay: boolean('nhan_ban_mau_nay').notNull().default(false),
    lyDoBo: lyDoBo('ly_do_bo'),
    ghiChu: text('ghi_chu'),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [
    index('contents_workspace_be_mat_trang_thai_idx').on(
      t.workspaceId,
      t.beMat,
      t.trangThai,
    ),
    // Dung cho trung vi 20 bai gan nhat cung workspace + cung be mat.
    index('contents_workspace_ngay_dang_idx').on(t.workspaceId, t.ngayDang.desc()),
    index('contents_parent_content_id_idx').on(t.parentContentId),
    index('contents_theo_doi_idx').on(t.workspaceId, t.trangThaiTheoDoi),
    // O tim kiem noi dung — pg_trgm da bat o Phase 1.
    index('contents_noi_dung_trgm_idx').using(
      'gin',
      sql`${t.noiDung} gin_trgm_ops`,
    ),
    // Thua ve mat logic (`id` da la khoa chinh) nhung BAT BUOC ve mat ky thuat:
    // khoa ngoai ghep cua `metric_snapshots` tro vao ba cot nay, ma PostgreSQL
    // chi cho tro vao mot bo cot co UNIQUE. Nho no, doi `be_mat` cua bai da co
    // ban chup do luong la LOI CSDL, khong phai gan lai lich su sang be mat khac
    // trong im lang.
    unique('contents_workspace_id_be_mat_key').on(t.workspaceId, t.id, t.beMat),
    // Hai cot chuoi bai di theo cap. Chi mot trong hai co gia tri nghia la mot
    // bai thuoc chuoi ma khong biet minh dung thu may, hoac dung thu ba cua
    // khong chuoi nao — ca hai deu la du lieu vo nghia, chan ngay tai CSDL.
    check(
      'contents_chuoi_bai_di_theo_cap',
      sql`(${t.chuoiId} IS NULL) = (${t.thuTuTrongChuoi} IS NULL)`,
    ),
    // Hai bai cung gianh mot cho trong chuoi la mat thu tu doc — ma thu tu doc
    // la toan bo y nghia cua chuoi bai.
    unique('contents_chuoi_thu_tu_key').on(t.workspaceId, t.chuoiId, t.thuTuTrongChuoi),
  ],
);

export const assets = pgTable(
  'assets',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    loai: loaiAsset('loai').notNull().default('anh'),
    // Duong dan tuong doi trong kho anh (o dia hoac R2) — khong luu URL tuyet doi
    // de doi kho luu tru khong phai sua du lieu.
    //
    // CHO RONG tu khi co bai keo ve: video KHONG duoc tai xuong (VPS dung chung,
    // khong chay ffmpeg), no chi co `urlNgoai`. Anh thi nguoc lai — anh duoc tai
    // ve vi lien ket CDN cua Facebook het han sau vai ngay, con tai anh la viec
    // doc-ghi thuan khong ton CPU.
    duongDan: text('duong_dan'),
    /** Lien ket goc o CDN cua nen tang. Het han duoc — day la ban ghi, khong phai kho. */
    urlNgoai: text('url_ngoai'),
    /**
     * Phu de boc tu video bang ElevenLabs Scribe.
     *
     * Nam o `assets` chu khong o `contents` vi mot bai co the co nhieu video, va
     * phu de thuoc ve video chu khong thuoc ve bai.
     */
    phuDe: text('phu_de'),
    tiLe: text('ti_le'),
    kichThuocByte: integer('kich_thuoc_byte'),
    modelRunId: uuid('model_run_id').references(() => modelRuns.id, {
      onDelete: 'set null',
    }),
    ngayTao: ngayTao(),
  },
  (t) => [
    index('assets_content_id_idx').on(t.contentId),
    // Mot asset khong co ca duong dan lan lien ket ngoai la mot dong vo nghia:
    // khong mo duoc bang duong nao.
    check(
      'assets_phai_co_duong_dan_hoac_url',
      sql`${t.duongDan} IS NOT NULL OR ${t.urlNgoai} IS NOT NULL`,
    ),
  ],
);

/**
 * Ban tho cua bai keo ve tu nen tang ngoai.
 *
 * VI SAO GIU NGUYEN VAN: bo boc du lieu se sai. Actor doi dinh dang, hoac ta bo
 * sot mot truong — lan dau keo 10 bai da lo ra dieu do (so luot thich nam trong
 * `raw_payload_json` chu khong nam o `stats` nhu actor quang cao). Giu ban tho
 * la viet lai bo boc roi chay lai toan bo lich su, khong phai tra tien keo lai.
 *
 * VI SAO LA BANG RIENG chu khong phai mot cot `jsonb` tren `contents`: moi ban
 * tho nang khoang 60KB. Tang truy cap du lieu dung `select()` lay het cot, nen
 * de chung la moi lan liet ke bang noi dung keo theo hang chuc MB vo ich.
 */
export const baiKeoTho = pgTable(
  'bai_keo_tho',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    contentId: uuid('content_id').references((): AnyPgColumn => contents.id, {
      onDelete: 'cascade',
    }),
    kenhDangId: uuid('kenh_dang_id').references(() => kenhDang.id, {
      onDelete: 'set null',
    }),
    /** Ma bai cua nen tang. Cung ma trong cung workspace chi duoc mot dong. */
    maBai: text('ma_bai').notNull(),
    /** Nguon da keo, vi du `apify:spbotdel/facebook-profile-posts-all-photos-scraper`. */
    nguon: text('nguon').notNull(),
    duLieu: jsonb('du_lieu').$type<Jsonb>().notNull(),
    /**
     * So lieu tuong tac BOC RA TU `duLieu`, khong phai nguon doc lap.
     *
     * VI SAO O DAY chu khong o `metric_snapshots`: bang do co rang buoc moi bai
     * mot moc chi mot dong VA mot trigger chan sua — dung cho phep do theo lich
     * T+7/T+30, noi mot ban chup la mot lan do bat bien tai mot thoi diem. Con
     * cac o nay la KET QUA BOC, va bo boc thi se duoc sua: lan dau no dem nham
     * vi so that nam trong `{count: N}` chu khong phai so tran. Sua bo boc roi
     * chay lai phai ghi de duoc, nen chung khong the song trong bang bat bien do.
     *
     * `null` = khong boc duoc, KHAC 0 = do duoc va bang khong.
     */
    soThich: integer('so_thich'),
    soBinhLuan: integer('so_binh_luan'),
    soChiaSe: integer('so_chia_se'),
    thoiLuongVideoMs: integer('thoi_luong_video_ms'),
    ngayKeo: ngayTao(),
  },
  (t) => [
    // Chan keo trung o TANG CO SO DU LIEU: keo lai cung mot kenh la chuyen binh
    // thuong (bai moi), nhung bai da co khong duoc sinh them mot ban nua.
    unique('bai_keo_tho_workspace_ma_bai_key').on(t.workspaceId, t.maBai),
    index('bai_keo_tho_content_id_idx').on(t.contentId),
  ],
);

export const qualityScores = pgTable(
  'quality_scores',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    diemBamTruCot: integer('diem_bam_tru_cot'),
    diemDungGiong: integer('diem_dung_giong'),
    diemCauMoDau: integer('diem_cau_mo_dau'),
    diemRoHanhDong: integer('diem_ro_hanh_dong'),
    diemTinhXacThuc: integer('diem_tinh_xac_thuc'),
    diemDoMoi: integer('diem_do_moi'),
    diemTong: integer('diem_tong'),
    // PRD muc 6: tieu chi Tinh xac thuc co quyen phu quyet — duoi 3 diem thi
    // chan chuyen sang San sang, du tong diem cao.
    coXacThucDat: boolean('co_xac_thuc_dat').notNull().default(true),
    gopYSua: jsonb('gop_y_sua').$type<string[]>(),
    diemChamTay: integer('diem_cham_tay'),
    canhBaoTrungGoc: boolean('canh_bao_trung_goc').notNull().default(false),
    contentTrungId: uuid('content_trung_id').references(
      (): AnyPgColumn => contents.id,
      { onDelete: 'set null' },
    ),
    modelRunId: uuid('model_run_id').references(() => modelRuns.id, {
      onDelete: 'set null',
    }),
    phienBanBoTieuChi: integer('phien_ban_bo_tieu_chi').notNull().default(1),
    ngayTao: ngayTao(),
  },
  (t) => [index('quality_scores_content_id_idx').on(t.contentId)],
);

/**
 * 30 cot hien cung luc la khong dung duoc (Phu luc A muc 5). Nam che do xem mac
 * dinh nam trong ma nguon; bang nay chi luu che do xem nguoi dung tu them.
 */
export const cheDoXem = pgTable(
  'che_do_xem',
  {
    id: idUuid(),
    workspaceId: khoaWorkspace(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ten: text('ten').notNull(),
    cotHien: jsonb('cot_hien').$type<string[]>().notNull(),
    boLoc: jsonb('bo_loc').$type<Jsonb>().notNull().default({}),
    ngayTao: ngayTao(),
    capNhat: capNhat(),
  },
  (t) => [unique('che_do_xem_workspace_user_ten_key').on(t.workspaceId, t.userId, t.ten)],
);
