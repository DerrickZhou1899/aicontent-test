ALTER TABLE "contents" ADD COLUMN "chuoi_id" uuid;--> statement-breakpoint
ALTER TABLE "contents" ADD COLUMN "thu_tu_trong_chuoi" integer;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_chuoi_thu_tu_key" UNIQUE("workspace_id","chuoi_id","thu_tu_trong_chuoi");--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_chuoi_bai_di_theo_cap" CHECK (("contents"."chuoi_id" IS NULL) = ("contents"."thu_tu_trong_chuoi" IS NULL));