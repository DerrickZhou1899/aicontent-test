/**
 * Nhóm nội dung — Phụ lục B mục 3.4 gộp với toàn bộ 7 nhóm cột của Phụ lục A
 * mục 3. Phụ lục B mô tả thiếu 6 cột mà bảng quản lý nội dung bắt buộc phải có;
 * schema này đóng băng cả hai nguồn để các đợt sau chỉ dùng, không sửa.
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

/** PRD mục 2 — bốn bề mặt đăng, đo bằng công thức khác nhau, không được gộp. */
export const beMat = pgEnum('be_mat', ['fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo']);

/** Vòng đời một nội dung — Phụ lục A mục 1. */
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
 * Khác `trang_thai` của nội dung: đây là trạng thái đường ống đo lường.
 * `loi_lien_ket` là bắt buộc — Phụ lục A mục 8 quy định trạng thái này khi kéo
 * thử thất bại, để người dùng biết ngay thay vì 7 ngày sau mới phát hiện hỏng.
 */
export const trangThaiTheoDoi = pgEnum('trang_thai_theo_doi', [
  'chua_dang',
  'dang_theo_doi',
  'loi_lien_ket',
  'da_chot',
]);

export const dangBai = pgEnum('dang_bai', ['chu', 'anh_chu', 'kich_ban_quay']);

/** Để trả lời: máy đề xuất hay người tự nghĩ ra bài tốt hơn. */
export const nguonYTuong = pgEnum('nguon_y_tuong', [
  'may-de-xuat',
  'xu-huong',
  'nguoi-tu-nhap',
]);

/** Sáu lựa chọn của Phụ lục A mục 4.1 — bắt buộc chọn một khi bỏ bài. */
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
 * Hai trong ba actor Apify đã chọn nhận URL KÊNH (trang / hồ sơ / tài khoản)
 * làm đầu vào rồi tự tìm bài, không nhận URL từng bài. Không lưu URL kênh thì
 * khối kéo số liệu không chạy được.
 */
export const kenhDang = pgTable(
  'kenh_dang',
  {
    id            : idUuid(),
    workspaceId   : khoaWorkspace(),
    beMat         : beMat('be_mat').notNull(),
    urlKenh       : text('url_kenh').notNull(),
    tenHienThi    : text('ten_hien_thi'),
    dangHoatDong : boolean('dang_hoat_dong').notNull().default(true),
    ngayTao      : ngayTao(),
    capNhat      : capNhat(),
  },
  (t) => [unique('kenh_dang_workspace_url_key').on(t.workspaceId, t.urlKenh)],
);

/**
 * Kênh CỦA NGƯỜI KHÁC mà workspace theo dõi để học chủ đề và cách kể.
 *
 * VÌ SAO KHÔNG DÙNG LẠI `kenh_dang`: hai bảng gần giống hình dạng nhưng ngược
 * nhau về nghĩa. `kenhDangRepo.dat()` cưỡng chế MỘT bề mặt MỘT kênh — đặt lại là
 * SỬA dòng cũ chứ không thêm dòng mới. Danh sách theo dõi cần NHIỀU kênh trên
 * cùng một bề mặt. Gộp lại là phá quy tắc đó và sửa mọi nơi đang dựa vào nó, để
 * đổi lấy việc bớt một bảng 9 cột.
 *
 * Kho kênh là CỦA CHUNG workspace: hai người cùng theo một kênh thì chỉ kéo MỘT
 * lượt. Ai theo dõi cái nào thì nằm ở `theo_doi_cua_toi`.
 */
export const kenhTheoDoi = pgTable(
  'kenh_theo_doi',
  {
    id           : idUuid(),
    workspaceId  : khoaWorkspace(),
    beMat        : beMat('be_mat').notNull(),
    urlKenh      : text('url_kenh').notNull(),
    tenHienThi   : text('ten_hien_thi'),
    dangHoatDong : boolean('dang_hoat_dong').notNull().default(true),
    /** `null` = chưa kéo lần nào. Mốc để tính đến hạn kéo tiếp. */
    lanKeoCuoi    : timestamp('lan_keo_cuoi', { withTimezone: true }),
    ngayTao       : ngayTao(),
    capNhat       : capNhat(),
  },
  (t) => [unique('kenh_theo_doi_workspace_url_key').on(t.workspaceId, t.urlKenh)],
);

/**
 * Danh sách theo dõi RIÊNG từng thành viên.
 *
 * Đây là trục cô lập THỨ HAI của hệ thống (trục thứ nhất là `workspace_id`).
 * Ý tưởng buổi sáng chỉ sinh từ kênh người đang đăng nhập theo dõi, nên sai ở
 * đây nghĩa là B đọc được tín hiệu của kênh A theo dõi.
 */
export const theoDoiCuaToi = pgTable(
  'theo_doi_cua_toi',
  {
    id             : idUuid(),
    workspaceId    : khoaWorkspace(),
    userId         : uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kenhTheoDoiId : uuid('kenh_theo_doi_id')
      .notNull()
      .references(() => kenhTheoDoi.id, { onDelete: 'cascade' }),
    ngayTao        : ngayTao(),
  },
  (t) => [
    unique('theo_doi_cua_toi_ws_user_kenh_key').on(t.workspaceId, t.userId, t.kenhTheoDoiId),
    index('theo_doi_cua_toi_ws_user_idx').on(t.workspaceId, t.userId),
  ],
);

/**
 * Một bài của kênh ngoài, hoặc một tín hiệu xu hướng không gắn kênh.
 *
 * BẢNG NÀY CÓ TRƯỚC (Phase 3) nhưng không mã ứng dụng nào dùng. Mở rộng nó thay
 * vì tạo bảng mới vì `ideas.trend_signal_id` đã trỏ vào đây rồi — tạo bảng mới
 * nghĩa là để bảng này chết vĩnh viễn VÀ phải thêm một khóa ngoại thứ hai lên
 * `ideas`.
 *
 * `kenh_theo_doi_id` và `ma_bai` để NULLABLE có chủ ý: các cột cũ được thiết kế
 * cho tín hiệu không gắn kênh (ví dụ "tuần này ngành đang nói về X"), chưa dùng
 * tới nhưng không siết chặt để còn đường cho nó.
 *
 * `so_thich` / `so_binh_luan` / `so_chia_se`: `null` = KHÔNG ĐO ĐƯỢC, khác hẳn 0
 * = đo được và bằng không. Bài học đã trả giá ở `lib/keo-bai/apify-ho-so-ca-nhan.ts`.
 */
export const trendSignals = pgTable(
  'trend_signals',
  {
    id               : idUuid(),
    workspaceId      : khoaWorkspace(),
    nguon            : text('nguon').notNull(),
    tieuDe           : text('tieu_de').notNull(),
    lienKet          : text('lien_ket'),
    thoiDiem         : timestamp('thoi_diem', { withTimezone: true }),
    diemLienQuan     : integer('diem_lien_quan'),
    daDung           : boolean('da_dung').notNull().default(false),
    ngayTao          : ngayTao(),

    kenhTheoDoiId    : uuid('kenh_theo_doi_id').references(() => kenhTheoDoi.id, {
      onDelete : 'cascade',
    }),
    /** Mã bài theo nền tảng. Ghép với `kenh_theo_doi_id` thành khóa chống trùng. */
    maBai            : text('ma_bai'),
    noiDung          : text('noi_dung'),
    dangBai          : dangBai('dang_bai'),
    soThich          : integer('so_thich'),
    soBinhLuan       : integer('so_binh_luan'),
    soChiaSe         : integer('so_chia_se'),
    thoiLuongVideoMs : integer('thoi_luong_video_ms'),
    /** `null` = chưa bóc. Bóc một lần rồi thôi, xem `lib/studio/boc-cong-thuc.ts`. */
    congThuc         : jsonb('cong_thuc').$type<Jsonb>(),
    /** Bản thô nguyên văn — dataset Apify bị xóa sau 7 ngày, không lưu là mất. */
    tho              : jsonb('tho').$type<Jsonb>(),
  },
  (t) => [
    index('trend_signals_workspace_thoi_diem_idx').on(t.workspaceId, t.thoiDiem),
    unique('trend_signals_kenh_ma_bai_key').on(t.kenhTheoDoiId, t.maBai),
    index('trend_signals_kenh_thoi_diem_idx').on(t.workspaceId, t.kenhTheoDoiId, t.thoiDiem),
    // Chỉ mục RIÊNG PHẦN cho vòng bóc cách kể: nó chọn `cong_thuc IS NULL` rồi
    // sắp theo `thoi_diem`. Chỉ mục chung ở trên không phục vụ được điều kiện
    // NULL. Riêng phần nên nó chỉ to bằng số bài CHƯA bóc — bài đã bóc xong rồi
    // tự rơi ra khỏi chỉ mục.
    index('trend_signals_chua_boc_idx')
      .on(t.workspaceId, t.thoiDiem)
      .where(sql`${t.congThuc} is null`),
  ],
);

export const ideas = pgTable(
  'ideas',
  {
    id            : idUuid(),
    workspaceId   : khoaWorkspace(),
    beMat         : beMat('be_mat').notNull(),
    tieuDe        : text('tieu_de').notNull(),
    gocTiepCan    : text('goc_tiep_can'),
    pillarId      : uuid('pillar_id').references(() => contentPillars.id, {
      onDelete : 'set null',
    }),
    personaId      : uuid('persona_id').references(() => personas.id, { onDelete: 'set null' }),
    productId      : uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    cauMoDau       : text('cau_mo_dau'),
    lyDoDeXuat     : text('ly_do_de_xuat'),
    nguonYTuong    : nguonYTuong('nguon_y_tuong').notNull().default('may-de-xuat'),
    trendSignalId : uuid('trend_signal_id').references(() => trendSignals.id, {
      onDelete : 'set null',
    }),
    modelRunId    : uuid('model_run_id').references(() => modelRuns.id, {
      onDelete : 'set null',
    }),
    daDung        : boolean('da_dung').notNull().default(false),
    ngayTao       : ngayTao(),
  },
  (t) => [index('ideas_workspace_ngay_tao_idx').on(t.workspaceId, t.ngayTao)],
);

export const contents = pgTable(
  'contents',
  {
    id          : idUuid(),
    workspaceId : khoaWorkspace(),
    ideaId      : uuid('idea_id').references(() => ideas.id, { onDelete: 'set null' }),
    // Một nội dung đăng lên hai bề mặt = hai dòng, nối với nhau qua cột này để
    // trả lời "cùng nội dung, bề mặt nào cho kết quả tốt hơn".
    parentContentId : uuid('parent_content_id').references(
      (): AnyPgColumn => contents.id,
      { onDelete: 'set null' },
    ),
    kenhDangId : uuid('kenh_dang_id').references(() => kenhDang.id, {
      onDelete : 'set null',
    }),
    beMat    : beMat('be_mat').notNull(),
    pillarId : uuid('pillar_id').references(() => contentPillars.id, {
      onDelete : 'set null',
    }),
    personaId  : uuid('persona_id').references(() => personas.id, { onDelete: 'set null' }),
    productId  : uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    gocTiepCan : text('goc_tiep_can'),
    dangBai    : dangBai('dang_bai'),
    /**
     * Chuỗi bài: nhiều bài nối tiếp theo MỘT MẠCH, khác hẳn `parent_content_id`.
     *
     * Hai quan hệ này bắt buộc phải tách đôi: `parent_content_id` nối các bản
     * CÙNG MỘT NỘI DUNG đăng trên các bề mặt khác nhau, và Phase 15 dựa vào nó
     * để trả lời "cùng nội dung, bề mặt nào cho kết quả tốt hơn". Nhét chuỗi bài
     * vào đó là bài 1 và bài 2 của một chuỗi bị đếm như hai bản của cùng một
     * nội dung — số liệu sai mà nhìn báo cáo không thể phát hiện.
     *
     * `chuoi_id` là khóa nhóm do ứng dụng sinh, KHÔNG trỏ vào bài đầu chuỗi:
     * xóa bài đầu không được làm cả chuỗi mất liên kết.
     */
    chuoiId         : uuid('chuoi_id'),
    thuTuTrongChuoi : integer('thu_tu_trong_chuoi'),
    nguonYTuong     : nguonYTuong('nguon_y_tuong').notNull().default('may-de-xuat'),
    cauMoDau        : text('cau_mo_dau'),
    noiDung         : text('noi_dung'),
    // Cột suy ra từ nội dung — để CSDL tính để không bao giờ lệch với nội dung thật.
    soKyTu : integer('so_ky_tu').generatedAlwaysAs(
      (): SQL => sql`char_length(coalesce(noi_dung, ''))`,
    ),
    moHinhDaSinh   : text('mo_hinh_da_sinh'),
    trangThai      : trangThaiNoiDung('trang_thai').notNull().default('y_tuong'),
    nguoiTao       : uuid('nguoi_tao').references(() => users.id, { onDelete: 'set null' }),
    ngayDuKienDang : timestamp('ngay_du_kien_dang', { withTimezone: true }),
    ngayDang       : timestamp('ngay_dang', { withTimezone: true }),
    /**
     * Lưu NGUYÊN VĂN liên kết người dùng dán vào, không chuẩn hóa. Khi cách bóc
     * mã bài hỏng (Facebook đổi dạng liên kết), viết lại bộ bóc rồi chạy lại
     * toàn bộ lịch sử. Bỏ cột này để "gọn" là mất khả năng sửa sai về sau.
     */
    lienKetGoc : text('lien_ket_goc'),
    /** Bóc từ liên kết gốc; cho NULL và cho nhập tay khi bóc tự động thất bại. */
    maBai            : text('ma_bai'),
    trangThaiTheoDoi : trangThaiTheoDoi('trang_thai_theo_doi')
      .notNull()
      .default('chua_dang'),
    // Phi chuẩn hóa có chủ ý: màn hình "Đang theo dõi" phải liệt kê hàng trăm
    // dòng kèm mốc kéo gần nhất; join max(thoi_diem_keo) cho từng dòng là đắt.
    lanKeoGanNhat : timestamp('lan_keo_gan_nhat', { withTimezone: true }),
    /** Quyết định có kéo mốc T+30 ngày hay không (Phụ lục A mục 8). */
    noiDungLauDai : boolean('noi_dung_lau_dai').notNull().default(false),
    nhanBanMauNay : boolean('nhan_ban_mau_nay').notNull().default(false),
    lyDoBo        : lyDoBo('ly_do_bo'),
    ghiChu        : text('ghi_chu'),
    ngayTao       : ngayTao(),
    capNhat       : capNhat(),
  },
  (t) => [
    index('contents_workspace_be_mat_trang_thai_idx').on(
      t.workspaceId,
      t.beMat,
      t.trangThai,
    ),
    // Dùng cho trung vị 20 bài gần nhất cùng workspace + cùng bề mặt.
    index('contents_workspace_ngay_dang_idx').on(t.workspaceId, t.ngayDang.desc()),
    index('contents_parent_content_id_idx').on(t.parentContentId),
    index('contents_theo_doi_idx').on(t.workspaceId, t.trangThaiTheoDoi),
    // Ô tìm kiếm nội dung — pg_trgm đã bật ở Phase 1.
    index('contents_noi_dung_trgm_idx').using(
      'gin',
      sql`${t.noiDung} gin_trgm_ops`,
    ),
    // Thừa về mặt logic (`id` đã là khóa chính) nhưng BẮT BUỘC về mặt kỹ thuật:
    // khóa ngoại ghép của `metric_snapshots` trỏ vào ba cột này, mà PostgreSQL
    // chỉ cho trỏ vào một bộ cột có UNIQUE. Nhờ nó, đổi `be_mat` của bài đã có
    // bản chụp đo lường là LỖI CSDL, không phải gán lại lịch sử sang bề mặt khác
    // trong im lặng.
    unique('contents_workspace_id_be_mat_key').on(t.workspaceId, t.id, t.beMat),
    // Hai cột chuỗi bài đi theo cặp. Chỉ một trong hai có giá trị nghĩa là một
    // bài thuộc chuỗi mà không biết mình đứng thứ mấy, hoặc đứng thứ ba của
    // không chuỗi nào — cả hai đều là dữ liệu vô nghĩa, chặn ngay tại CSDL.
    check(
      'contents_chuoi_bai_di_theo_cap',
      sql`(${t.chuoiId} IS NULL) = (${t.thuTuTrongChuoi} IS NULL)`,
    ),
    // Hai bài cùng giành một chỗ trong chuỗi là mất thứ tự đọc — mà thứ tự đọc
    // là toàn bộ ý nghĩa của chuỗi bài.
    unique('contents_chuoi_thu_tu_key').on(t.workspaceId, t.chuoiId, t.thuTuTrongChuoi),
  ],
);

export const assets = pgTable(
  'assets',
  {
    id          : idUuid(),
    workspaceId : khoaWorkspace(),
    contentId   : uuid('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    loai : loaiAsset('loai').notNull().default('anh'),
    // Đường dẫn tương đối trong kho ảnh (ổ đĩa hoặc R2) — không lưu URL tuyệt đối
    // để đổi kho lưu trữ không phải sửa dữ liệu.
    //
    // CHO RỖNG từ khi có bài kéo về: video KHÔNG được tải xuống (VPS dùng chung,
    // không chạy ffmpeg), nó chỉ có `urlNgoai`. Ảnh thì ngược lại — ảnh được tải
    // về vì liên kết CDN của Facebook hết hạn sau vài ngày, còn tải ảnh là việc
    // đọc-ghi thuần không tốn CPU.
    duongDan : text('duong_dan'),
    /** Liên kết gốc ở CDN của nền tảng. Hết hạn được — đây là bản ghi, không phải kho. */
    urlNgoai : text('url_ngoai'),
    /**
     * Phụ đề bóc từ video bằng ElevenLabs Scribe.
     *
     * Nằm ở `assets` chứ không ở `contents` vì một bài có thể có nhiều video, và
     * phụ đề thuộc về video chứ không thuộc về bài.
     */
    phuDe         : text('phu_de'),
    tiLe          : text('ti_le'),
    kichThuocByte : integer('kich_thuoc_byte'),
    modelRunId    : uuid('model_run_id').references(() => modelRuns.id, {
      onDelete : 'set null',
    }),
    ngayTao : ngayTao(),
  },
  (t) => [
    index('assets_content_id_idx').on(t.contentId),
    // Một asset không có cả đường dẫn lẫn liên kết ngoài là một dòng vô nghĩa:
    // không mở được bằng đường nào.
    check(
      'assets_phai_co_duong_dan_hoac_url',
      sql`${t.duongDan} IS NOT NULL OR ${t.urlNgoai} IS NOT NULL`,
    ),
  ],
);

/**
 * Bản thô của bài kéo về từ nền tảng ngoài.
 *
 * VÌ SAO GIỮ NGUYÊN VĂN: bộ bóc dữ liệu sẽ sai. Actor đổi định dạng, hoặc ta bỏ
 * sót một trường — lần đầu kéo 10 bài đã lộ ra điều đó (số lượt thích nằm trong
 * `raw_payload_json` chứ không nằm ở `stats` như actor quảng cáo). Giữ bản thô
 * là viết lại bộ bóc rồi chạy lại toàn bộ lịch sử, không phải trả tiền kéo lại.
 *
 * VÌ SAO LÀ BẢNG RIÊNG chứ không phải một cột `jsonb` trên `contents`: mỗi bản
 * thô nặng khoảng 60KB. Tầng truy cập dữ liệu dùng `select()` lấy hết cột, nên
 * để chung là mỗi lần liệt kê bảng nội dung kéo theo hàng chục MB vô ích.
 */
export const baiKeoTho = pgTable(
  'bai_keo_tho',
  {
    id          : idUuid(),
    workspaceId : khoaWorkspace(),
    contentId   : uuid('content_id').references((): AnyPgColumn => contents.id, {
      onDelete : 'cascade',
    }),
    kenhDangId : uuid('kenh_dang_id').references(() => kenhDang.id, {
      onDelete : 'set null',
    }),
    /** Mã bài của nền tảng. Cùng mã trong cùng workspace chỉ được một dòng. */
    maBai : text('ma_bai').notNull(),
    /** Nguồn đã kéo, ví dụ `apify:spbotdel/facebook-profile-posts-all-photos-scraper`. */
    nguon  : text('nguon').notNull(),
    duLieu : jsonb('du_lieu').$type<Jsonb>().notNull(),
    /**
     * Số liệu tương tác BÓC RA TỪ `duLieu`, không phải nguồn độc lập.
     *
     * VÌ SAO Ở ĐÂY chứ không ở `metric_snapshots`: bảng đó có ràng buộc mỗi bài
     * một mốc chỉ một dòng VÀ một trigger chặn sửa — dùng cho phép đo theo lịch
     * T+7/T+30, nơi một bản chụp là một lần đo bất biến tại một thời điểm. Còn
     * các ô này là KẾT QUẢ BÓC, và bộ bóc thì sẽ được sửa: lần đầu nó đếm nhầm
     * vì số thật nằm trong `{count: N}` chứ không phải số trần. Sửa bộ bóc rồi
     * chạy lại phải ghi đè được, nên chúng không thể sống trong bảng bất biến đó.
     *
     * `null` = không bóc được, KHÁC 0 = đo được và bằng không.
     */
    soThich          : integer('so_thich'),
    soBinhLuan       : integer('so_binh_luan'),
    soChiaSe         : integer('so_chia_se'),
    thoiLuongVideoMs : integer('thoi_luong_video_ms'),
    ngayKeo          : ngayTao(),
  },
  (t) => [
    // Chặn kéo trùng ở TẦNG CƠ SỞ DỮ LIỆU: kéo lại cùng một kênh là chuyện bình
    // thường (bài mới), nhưng bài đã có không được sinh thêm một bản nữa.
    unique('bai_keo_tho_workspace_ma_bai_key').on(t.workspaceId, t.maBai),
    index('bai_keo_tho_content_id_idx').on(t.contentId),
  ],
);

export const qualityScores = pgTable(
  'quality_scores',
  {
    id          : idUuid(),
    workspaceId : khoaWorkspace(),
    contentId   : uuid('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    diemBamTruCot   : integer('diem_bam_tru_cot'),
    diemDungGiong   : integer('diem_dung_giong'),
    diemCauMoDau    : integer('diem_cau_mo_dau'),
    diemRoHanhDong  : integer('diem_ro_hanh_dong'),
    diemTinhXacThuc : integer('diem_tinh_xac_thuc'),
    diemDoMoi       : integer('diem_do_moi'),
    diemTong        : integer('diem_tong'),
    // PRD mục 6: tiêu chí Tính xác thực có quyền phủ quyết — dưới 3 điểm thì
    // chặn chuyển sang Sẵn sàng, dù tổng điểm cao.
    coXacThucDat    : boolean('co_xac_thuc_dat').notNull().default(true),
    gopYSua         : jsonb('gop_y_sua').$type<string[]>(),
    diemChamTay     : integer('diem_cham_tay'),
    canhBaoTrungGoc : boolean('canh_bao_trung_goc').notNull().default(false),
    contentTrungId  : uuid('content_trung_id').references(
      (): AnyPgColumn => contents.id,
      { onDelete: 'set null' },
    ),
    modelRunId : uuid('model_run_id').references(() => modelRuns.id, {
      onDelete : 'set null',
    }),
    phienBanBoTieuChi : integer('phien_ban_bo_tieu_chi').notNull().default(1),
    ngayTao           : ngayTao(),
  },
  (t) => [index('quality_scores_content_id_idx').on(t.contentId)],
);

/**
 * 30 cột hiện cùng lúc là không dùng được (Phụ lục A mục 5). Năm chế độ xem mặc
 * định nằm trong mã nguồn; bảng này chỉ lưu chế độ xem người dùng tự thêm.
 */
export const cheDoXem = pgTable(
  'che_do_xem',
  {
    id          : idUuid(),
    workspaceId : khoaWorkspace(),
    userId      : uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ten     : text('ten').notNull(),
    cotHien : jsonb('cot_hien').$type<string[]>().notNull(),
    boLoc   : jsonb('bo_loc').$type<Jsonb>().notNull().default({}),
    ngayTao : ngayTao(),
    capNhat : capNhat(),
  },
  (t) => [unique('che_do_xem_workspace_user_ten_key').on(t.workspaceId, t.userId, t.ten)],
);
