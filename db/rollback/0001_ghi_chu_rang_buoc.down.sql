-- Hoan tac migration 0001_ghi_chu_rang_buoc (chi go ghi chu, khong dong den du lieu).
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0001_ghi_chu_rang_buoc.down.sql

BEGIN;

COMMENT ON COLUMN "metric_snapshots"."status" IS NULL;
COMMENT ON COLUMN "metric_snapshots"."raw_payload" IS NULL;
COMMENT ON COLUMN "effectiveness_scores"."formula_version" IS NULL;
COMMENT ON COLUMN "contents"."lien_ket_goc" IS NULL;
COMMENT ON COLUMN "contents"."ma_bai" IS NULL;
COMMENT ON COLUMN "contents"."parent_content_id" IS NULL;
COMMENT ON COLUMN "content_pillars"."khoa_khong_tu_giam" IS NULL;
COMMENT ON COLUMN "jobs"."idempotency_key" IS NULL;
COMMENT ON CONSTRAINT "oauth_accounts_provider_tai_khoan_key" ON "oauth_accounts" IS NULL;

DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
