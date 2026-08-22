ALTER TABLE "pillar_stats" DROP CONSTRAINT "pillar_stats_ky_key";--> statement-breakpoint
DROP INDEX "metric_snapshots_content_moc_idx";--> statement-breakpoint
ALTER TABLE "pillar_stats" ADD COLUMN "dang_bai" "dang_bai";--> statement-breakpoint
ALTER TABLE "pillar_stats" ADD COLUMN "goc_tiep_can" text;--> statement-breakpoint
ALTER TABLE "pillar_stats" ADD COLUMN "persona_id" uuid;--> statement-breakpoint
ALTER TABLE "pillar_stats" ADD CONSTRAINT "pillar_stats_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_content_moc_key" UNIQUE("content_id","moc");--> statement-breakpoint
ALTER TABLE "pillar_stats" ADD CONSTRAINT "pillar_stats_ky_key" UNIQUE NULLS NOT DISTINCT("workspace_id","pillar_id","be_mat","dang_bai","goc_tiep_can","persona_id","ky_bat_dau");