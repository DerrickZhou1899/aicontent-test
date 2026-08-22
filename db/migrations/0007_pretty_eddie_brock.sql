CREATE TABLE "kenh_theo_doi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"be_mat" "be_mat" NOT NULL,
	"url_kenh" text NOT NULL,
	"ten_hien_thi" text,
	"dang_hoat_dong" boolean DEFAULT true NOT NULL,
	"lan_keo_cuoi" timestamp with time zone,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	"cap_nhat" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kenh_theo_doi_workspace_url_key" UNIQUE("workspace_id","url_kenh")
);
--> statement-breakpoint
CREATE TABLE "theo_doi_cua_toi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kenh_theo_doi_id" uuid NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "theo_doi_cua_toi_ws_user_kenh_key" UNIQUE("workspace_id","user_id","kenh_theo_doi_id")
);
--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "kenh_theo_doi_id" uuid;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "ma_bai" text;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "noi_dung" text;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "dang_bai" "dang_bai";--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "so_thich" integer;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "so_binh_luan" integer;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "so_chia_se" integer;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "thoi_luong_video_ms" integer;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "cong_thuc" jsonb;--> statement-breakpoint
ALTER TABLE "trend_signals" ADD COLUMN "tho" jsonb;--> statement-breakpoint
ALTER TABLE "kenh_theo_doi" ADD CONSTRAINT "kenh_theo_doi_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theo_doi_cua_toi" ADD CONSTRAINT "theo_doi_cua_toi_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theo_doi_cua_toi" ADD CONSTRAINT "theo_doi_cua_toi_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theo_doi_cua_toi" ADD CONSTRAINT "theo_doi_cua_toi_kenh_theo_doi_id_kenh_theo_doi_id_fk" FOREIGN KEY ("kenh_theo_doi_id") REFERENCES "public"."kenh_theo_doi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "theo_doi_cua_toi_ws_user_idx" ON "theo_doi_cua_toi" USING btree ("workspace_id","user_id");--> statement-breakpoint
ALTER TABLE "trend_signals" ADD CONSTRAINT "trend_signals_kenh_theo_doi_id_kenh_theo_doi_id_fk" FOREIGN KEY ("kenh_theo_doi_id") REFERENCES "public"."kenh_theo_doi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trend_signals_kenh_thoi_diem_idx" ON "trend_signals" USING btree ("workspace_id","kenh_theo_doi_id","thoi_diem");--> statement-breakpoint
ALTER TABLE "trend_signals" ADD CONSTRAINT "trend_signals_kenh_ma_bai_key" UNIQUE("kenh_theo_doi_id","ma_bai");