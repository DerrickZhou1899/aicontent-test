CREATE TYPE "public"."vai_tro_thanh_vien" AS ENUM('chu_so_huu', 'thanh_vien', 'quan_tri_he_thong');--> statement-breakpoint
CREATE TYPE "public"."loai_chi_phi" AS ENUM('goi-mo-hinh', 'sinh-anh', 'apify', 'luu-tru', 'khac');--> statement-breakpoint
CREATE TYPE "public"."loai_viec" AS ENUM('sinh-y-tuong', 'sinh-bai', 'sinh-kich-ban', 'cham-chat-luong', 'boc-tach-ho-so', 'sinh-anh', 'kiem-tra-lien-ket', 'keo-so-lieu-lo', 'quet-xu-huong', 'phan-loai-binh-luan', 'tinh-diem-hieu-qua', 'tong-hop-tuan');--> statement-breakpoint
CREATE TYPE "public"."nhiem_vu_mo_hinh" AS ENUM('viet-bai', 'viet-kich-ban', 'de-xuat-y-tuong', 'cham-chat-luong', 'phan-loai-binh-luan', 'boc-tach-ho-so', 'cham-diem-lien-quan', 'sinh-anh');--> statement-breakpoint
CREATE TYPE "public"."trang_thai_job" AS ENUM('cho', 'dang_chay', 'xong', 'loi', 'huy');--> statement-breakpoint
CREATE TYPE "public"."be_mat" AS ENUM('fanpage', 'ho_so_ca_nhan', 'tiktok', 'zalo');--> statement-breakpoint
CREATE TYPE "public"."dang_bai" AS ENUM('chu', 'anh_chu', 'kich_ban_quay');--> statement-breakpoint
CREATE TYPE "public"."loai_asset" AS ENUM('anh', 'video', 'tep');--> statement-breakpoint
CREATE TYPE "public"."ly_do_bo" AS ENUM('khong_dung_giong', 'sao_nhat', 'sai_chan_dung', 'trung_bai_da_dang', 'khong_hop_be_mat', 'thong_tin_sai');--> statement-breakpoint
CREATE TYPE "public"."nguon_y_tuong" AS ENUM('may-de-xuat', 'xu-huong', 'nguoi-tu-nhap');--> statement-breakpoint
CREATE TYPE "public"."trang_thai_noi_dung" AS ENUM('y_tuong', 'ban_nhap', 'da_cham', 'san_sang', 'da_dang', 'dang_theo_doi', 'da_chot_ket_qua', 'da_bo');--> statement-breakpoint
CREATE TYPE "public"."trang_thai_theo_doi" AS ENUM('chua_dang', 'dang_theo_doi', 'loi_lien_ket', 'da_chot');--> statement-breakpoint
CREATE TYPE "public"."moc_do_luong" AS ENUM('kiem_tra', 't_24_gio', 't_7_ngay', 't_30_ngay');--> statement-breakpoint
CREATE TYPE "public"."nguon_so_lieu" AS ENUM('apify', 'manual');--> statement-breakpoint
CREATE TYPE "public"."nhom_y_dinh" AS ENUM('mua', 'quan_tam', 'xa_giao', 'rac');--> statement-breakpoint
CREATE TYPE "public"."trang_thai_snapshot" AS ENUM('co_du_lieu', 'khong_do_duoc', 'loi', 'chua_toi_han');--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"loai" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_accounts_provider_tai_khoan_key" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"dau_vet_thiet_bi" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ten" text,
	"email" text NOT NULL,
	"email_xac_thuc_luc" timestamp with time zone,
	"anh" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"lan_dang_nhap_cuoi" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vai_tro" "vai_tro_thanh_vien" DEFAULT 'thanh_vien' NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_user_key" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ten" text NOT NULL,
	"chu_so_huu_id" uuid NOT NULL,
	"ngon_ngu" text DEFAULT 'vi' NOT NULL,
	"mui_gio" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"mo_ta" text,
	"giong_dieu" text,
	"dieu_cam_ky" text,
	"mau_sac" jsonb,
	"phong_chu" text,
	"do_day_du" integer DEFAULT 0 NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_profiles_workspace_id_key" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "content_pillars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"ten" text NOT NULL,
	"muc_dich" text,
	"ti_le_muc_tieu" numeric(5, 2),
	"khoa_khong_tu_giam" boolean DEFAULT false NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"noi_dung" text NOT NULL,
	"bang_chung" text,
	"nguon" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"ten" text NOT NULL,
	"do_tuoi" text,
	"nghe_nghiep" text,
	"noi_dau" text,
	"mong_muon" text,
	"cau_noi_thuong_dung" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"ten" text NOT NULL,
	"gia" text,
	"loi_ich" text,
	"phan_doi_thuong_gap" text,
	"loi_keu_goi" text,
	"lien_ket" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"loai_chi_phi" "loai_chi_phi" NOT NULL,
	"so_luong" numeric(12, 4) NOT NULL,
	"chi_phi_uoc_tinh" numeric(12, 4) NOT NULL,
	"don_vi_tien" text DEFAULT 'VND' NOT NULL,
	"model_run_id" uuid,
	"ghi_chu" text,
	"ngay" timestamp with time zone DEFAULT now() NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"bien_dong_luot" integer NOT NULL,
	"ly_do" text NOT NULL,
	"so_du_sau" integer NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"loai_viec" "loai_viec" NOT NULL,
	"du_lieu_vao" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trang_thai" "trang_thai_job" DEFAULT 'cho' NOT NULL,
	"so_lan_thu" integer DEFAULT 0 NOT NULL,
	"idempotency_key" text,
	"thoi_diem_chay" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_by" text,
	"locked_at" timestamp with time zone,
	"loi" text,
	"ket_qua" jsonb,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_idempotency_key_key" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "model_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"job_id" uuid,
	"nhiem_vu" "nhiem_vu_mo_hinh" NOT NULL,
	"mo_hinh" text NOT NULL,
	"do_dai_vao" integer,
	"do_dai_ra" integer,
	"thoi_gian_chay_ms" integer,
	"thanh_cong" boolean NOT NULL,
	"loi" text,
	"content_id" uuid,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"loai" "loai_asset" DEFAULT 'anh' NOT NULL,
	"duong_dan" text NOT NULL,
	"ti_le" text,
	"kich_thuoc_byte" integer,
	"model_run_id" uuid,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "che_do_xem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"ten" text NOT NULL,
	"cot_hien" jsonb NOT NULL,
	"bo_loc" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "che_do_xem_workspace_user_ten_key" UNIQUE("workspace_id","user_id","ten")
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"idea_id" uuid,
	"parent_content_id" uuid,
	"kenh_dang_id" uuid,
	"be_mat" "be_mat" NOT NULL,
	"pillar_id" uuid,
	"persona_id" uuid,
	"product_id" uuid,
	"goc_tiep_can" text,
	"dang_bai" "dang_bai",
	"nguon_y_tuong" "nguon_y_tuong" DEFAULT 'may-de-xuat' NOT NULL,
	"cau_mo_dau" text,
	"noi_dung" text,
	"so_ky_tu" integer GENERATED ALWAYS AS (char_length(coalesce(noi_dung, ''))) STORED,
	"mo_hinh_da_sinh" text,
	"trang_thai" "trang_thai_noi_dung" DEFAULT 'y_tuong' NOT NULL,
	"nguoi_tao" uuid,
	"ngay_du_kien_dang" timestamp with time zone,
	"ngay_dang" timestamp with time zone,
	"lien_ket_goc" text,
	"ma_bai" text,
	"trang_thai_theo_doi" "trang_thai_theo_doi" DEFAULT 'chua_dang' NOT NULL,
	"lan_keo_gan_nhat" timestamp with time zone,
	"noi_dung_lau_dai" boolean DEFAULT false NOT NULL,
	"nhan_ban_mau_nay" boolean DEFAULT false NOT NULL,
	"ly_do_bo" "ly_do_bo",
	"ghi_chu" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"be_mat" "be_mat" NOT NULL,
	"goc_tiep_can" text,
	"pillar_id" uuid,
	"persona_id" uuid,
	"product_id" uuid,
	"cau_mo_dau" text,
	"ly_do_de_xuat" text,
	"nguon_y_tuong" "nguon_y_tuong" DEFAULT 'may-de-xuat' NOT NULL,
	"trend_signal_id" uuid,
	"model_run_id" uuid,
	"da_dung" boolean DEFAULT false NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kenh_dang" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"be_mat" "be_mat" NOT NULL,
	"url_kenh" text NOT NULL,
	"ten_hien_thi" text,
	"dang_hoat_dong" boolean DEFAULT true NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kenh_dang_workspace_url_key" UNIQUE("workspace_id","url_kenh")
);
--> statement-breakpoint
CREATE TABLE "quality_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"diem_bam_tru_cot" integer,
	"diem_dung_giong" integer,
	"diem_cau_mo_dau" integer,
	"diem_ro_hanh_dong" integer,
	"diem_tinh_xac_thuc" integer,
	"diem_do_moi" integer,
	"diem_tong" integer,
	"co_xac_thuc_dat" boolean DEFAULT true NOT NULL,
	"gop_y_sua" jsonb,
	"diem_cham_tay" integer,
	"canh_bao_trung_goc" boolean DEFAULT false NOT NULL,
	"content_trung_id" uuid,
	"model_run_id" uuid,
	"phien_ban_bo_tieu_chi" integer DEFAULT 1 NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trend_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"nguon" text NOT NULL,
	"tieu_de" text NOT NULL,
	"lien_ket" text,
	"thoi_diem" timestamp with time zone,
	"diem_lien_quan" integer,
	"da_dung" boolean DEFAULT false NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"comment_id" uuid NOT NULL,
	"nhom_y_dinh" "nhom_y_dinh" NOT NULL,
	"diem" integer NOT NULL,
	"model_run_id" uuid,
	"phien_ban_bo_phan_loai" integer DEFAULT 1 NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_classifications_comment_phien_ban_key" UNIQUE("comment_id","phien_ban_bo_phan_loai")
);
--> statement-breakpoint
CREATE TABLE "comments_raw" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"ma_binh_luan" text,
	"noi_dung" text NOT NULL,
	"tac_gia_an_danh" text,
	"thoi_diem" timestamp with time zone,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_raw_content_ma_binh_luan_key" UNIQUE("content_id","ma_binh_luan")
);
--> statement-breakpoint
CREATE TABLE "effectiveness_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"formula_version" integer NOT NULL,
	"diem_thanh_phan" jsonb NOT NULL,
	"diem_tong_chuan_hoa" double precision,
	"so_trung_vi" double precision,
	"xep_hang_trong_tuan" integer,
	"tuan_bat_dau" date,
	"do_tin_cay_thap" boolean DEFAULT false NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "effectiveness_scores_snapshot_formula_key" UNIQUE("snapshot_id","formula_version")
);
--> statement-breakpoint
CREATE TABLE "metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"moc" "moc_do_luong" NOT NULL,
	"thoi_diem_keo" timestamp with time zone DEFAULT now() NOT NULL,
	"nguon" "nguon_so_lieu" NOT NULL,
	"thich" integer,
	"binh_luan" integer,
	"chia_se" integer,
	"luu" integer,
	"luot_xem" integer,
	"tin_nhan_hoi" integer,
	"raw_payload" jsonb NOT NULL,
	"status" "trang_thai_snapshot" NOT NULL,
	"phien_ban_trinh_thu_thap" text,
	"loi" text,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pillar_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"pillar_id" uuid NOT NULL,
	"be_mat" "be_mat" NOT NULL,
	"ky_bat_dau" date NOT NULL,
	"ky_ket_thuc" date NOT NULL,
	"so_bai_du_mau" integer DEFAULT 0 NOT NULL,
	"diem_trung_binh" double precision,
	"formula_version" integer NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pillar_stats_ky_key" UNIQUE("workspace_id","pillar_id","be_mat","ky_bat_dau")
);
--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_chu_so_huu_id_users_id_fk" FOREIGN KEY ("chu_so_huu_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pillars" ADD CONSTRAINT "content_pillars_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_log" ADD CONSTRAINT "cost_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_log" ADD CONSTRAINT "cost_log_model_run_id_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."model_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_runs" ADD CONSTRAINT "model_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_runs" ADD CONSTRAINT "model_runs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_model_run_id_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."model_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "che_do_xem" ADD CONSTRAINT "che_do_xem_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "che_do_xem" ADD CONSTRAINT "che_do_xem_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_parent_content_id_contents_id_fk" FOREIGN KEY ("parent_content_id") REFERENCES "public"."contents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_kenh_dang_id_kenh_dang_id_fk" FOREIGN KEY ("kenh_dang_id") REFERENCES "public"."kenh_dang"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_pillar_id_content_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."content_pillars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_nguoi_tao_users_id_fk" FOREIGN KEY ("nguoi_tao") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_pillar_id_content_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."content_pillars"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_trend_signal_id_trend_signals_id_fk" FOREIGN KEY ("trend_signal_id") REFERENCES "public"."trend_signals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_model_run_id_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."model_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kenh_dang" ADD CONSTRAINT "kenh_dang_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_scores" ADD CONSTRAINT "quality_scores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_scores" ADD CONSTRAINT "quality_scores_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_scores" ADD CONSTRAINT "quality_scores_content_trung_id_contents_id_fk" FOREIGN KEY ("content_trung_id") REFERENCES "public"."contents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_scores" ADD CONSTRAINT "quality_scores_model_run_id_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."model_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD CONSTRAINT "trend_signals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_classifications" ADD CONSTRAINT "comment_classifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_classifications" ADD CONSTRAINT "comment_classifications_comment_id_comments_raw_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments_raw"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_classifications" ADD CONSTRAINT "comment_classifications_model_run_id_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."model_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments_raw" ADD CONSTRAINT "comments_raw_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments_raw" ADD CONSTRAINT "comments_raw_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments_raw" ADD CONSTRAINT "comments_raw_snapshot_id_metric_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."metric_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_snapshot_id_metric_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."metric_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pillar_stats" ADD CONSTRAINT "pillar_stats_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pillar_stats" ADD CONSTRAINT "pillar_stats_pillar_id_content_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."content_pillars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_pillars_workspace_id_idx" ON "content_pillars" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "insights_workspace_id_idx" ON "insights" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "personas_workspace_id_idx" ON "personas" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "products_workspace_id_idx" ON "products" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "cost_log_workspace_ngay_idx" ON "cost_log" USING btree ("workspace_id","ngay");--> statement-breakpoint
CREATE INDEX "credit_ledger_workspace_ngay_tao_idx" ON "credit_ledger" USING btree ("workspace_id","ngay_tao");--> statement-breakpoint
CREATE INDEX "jobs_trang_thai_thoi_diem_chay_idx" ON "jobs" USING btree ("trang_thai","thoi_diem_chay");--> statement-breakpoint
CREATE INDEX "jobs_locked_at_idx" ON "jobs" USING btree ("locked_at");--> statement-breakpoint
CREATE INDEX "jobs_workspace_id_idx" ON "jobs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "model_runs_workspace_ngay_tao_idx" ON "model_runs" USING btree ("workspace_id","ngay_tao");--> statement-breakpoint
CREATE INDEX "model_runs_content_id_idx" ON "model_runs" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "assets_content_id_idx" ON "assets" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "contents_workspace_be_mat_trang_thai_idx" ON "contents" USING btree ("workspace_id","be_mat","trang_thai");--> statement-breakpoint
CREATE INDEX "contents_workspace_ngay_dang_idx" ON "contents" USING btree ("workspace_id","ngay_dang" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "contents_parent_content_id_idx" ON "contents" USING btree ("parent_content_id");--> statement-breakpoint
CREATE INDEX "contents_theo_doi_idx" ON "contents" USING btree ("workspace_id","trang_thai_theo_doi");--> statement-breakpoint
CREATE INDEX "contents_noi_dung_trgm_idx" ON "contents" USING gin ("noi_dung" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "ideas_workspace_ngay_tao_idx" ON "ideas" USING btree ("workspace_id","ngay_tao");--> statement-breakpoint
CREATE INDEX "quality_scores_content_id_idx" ON "quality_scores" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "trend_signals_workspace_thoi_diem_idx" ON "trend_signals" USING btree ("workspace_id","thoi_diem");--> statement-breakpoint
CREATE INDEX "comment_classifications_nhom_y_dinh_idx" ON "comment_classifications" USING btree ("workspace_id","nhom_y_dinh");--> statement-breakpoint
CREATE INDEX "comments_raw_content_id_idx" ON "comments_raw" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "comments_raw_snapshot_id_idx" ON "comments_raw" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "effectiveness_scores_content_id_idx" ON "effectiveness_scores" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "effectiveness_scores_workspace_tuan_idx" ON "effectiveness_scores" USING btree ("workspace_id","tuan_bat_dau");--> statement-breakpoint
CREATE INDEX "metric_snapshots_content_moc_idx" ON "metric_snapshots" USING btree ("content_id","moc");--> statement-breakpoint
CREATE INDEX "metric_snapshots_workspace_thoi_diem_idx" ON "metric_snapshots" USING btree ("workspace_id","thoi_diem_keo");--> statement-breakpoint
CREATE INDEX "metric_snapshots_status_idx" ON "metric_snapshots" USING btree ("status");