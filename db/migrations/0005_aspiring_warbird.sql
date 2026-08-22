CREATE TABLE "bai_keo_tho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_id" uuid,
	"kenh_dang_id" uuid,
	"ma_bai" text NOT NULL,
	"nguon" text NOT NULL,
	"du_lieu" jsonb NOT NULL,
	"ngay_tao" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bai_keo_tho_workspace_ma_bai_key" UNIQUE("workspace_id","ma_bai")
);
--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "duong_dan" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "url_ngoai" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "phu_de" text;--> statement-breakpoint
ALTER TABLE "bai_keo_tho" ADD CONSTRAINT "bai_keo_tho_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bai_keo_tho" ADD CONSTRAINT "bai_keo_tho_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bai_keo_tho" ADD CONSTRAINT "bai_keo_tho_kenh_dang_id_kenh_dang_id_fk" FOREIGN KEY ("kenh_dang_id") REFERENCES "public"."kenh_dang"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bai_keo_tho_content_id_idx" ON "bai_keo_tho" USING btree ("content_id");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_phai_co_duong_dan_hoac_url" CHECK ("assets"."duong_dan" IS NOT NULL OR "assets"."url_ngoai" IS NOT NULL);