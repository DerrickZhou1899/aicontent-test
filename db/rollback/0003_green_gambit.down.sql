-- Hoan tac migration 0003_green_gambit (siet 4 bat bien do luong).
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0003_green_gambit.down.sql
--
-- CANH BAO: hai cot `metric_snapshots.be_mat` va `effectiveness_scores.snapshot_status`
-- bi XOA o day. Chay ban nay khi hai bang da co du lieu that la mat be mat da
-- ghim tai thoi diem do — khong dung lai duoc tu `contents` neu bai da doi be mat.
-- Kiem so dong truoc khi chay.

BEGIN;

DROP TRIGGER IF EXISTS metric_snapshots_chi_ghi_them ON "metric_snapshots";
DROP FUNCTION IF EXISTS chan_sua_metric_snapshots();

-- Thu tu nguoc voi migration: go khoa ngoai truoc, roi moi go UNIQUE do chung.
ALTER TABLE "effectiveness_scores" DROP CONSTRAINT "effectiveness_scores_chi_cham_ban_do_duoc";
ALTER TABLE "effectiveness_scores" DROP CONSTRAINT "effectiveness_scores_content_fk";
ALTER TABLE "effectiveness_scores" DROP CONSTRAINT "effectiveness_scores_snapshot_fk";
ALTER TABLE "metric_snapshots" DROP CONSTRAINT "metric_snapshots_content_fk";

ALTER TABLE "metric_snapshots" DROP CONSTRAINT "metric_snapshots_content_id_key";
ALTER TABLE "metric_snapshots" DROP CONSTRAINT "metric_snapshots_workspace_id_status_key";
ALTER TABLE "contents" DROP CONSTRAINT "contents_workspace_id_be_mat_key";

ALTER TABLE "metric_snapshots" DROP COLUMN "be_mat";
ALTER TABLE "effectiveness_scores" DROP COLUMN "snapshot_status";

-- Tra ba khoa ngoai roi ve dung ten cu ma drizzle da sinh o migration 0000.
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_content_id_contents_id_fk"
  FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_snapshot_id_metric_snapshots_id_fk"
  FOREIGN KEY ("snapshot_id") REFERENCES "public"."metric_snapshots"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_content_id_contents_id_fk"
  FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;

DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
