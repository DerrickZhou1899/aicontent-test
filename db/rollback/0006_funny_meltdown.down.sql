-- Hoan tac migration 0006_funny_meltdown (so lieu boc ra tren bang ban tho).
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0006_funny_meltdown.down.sql
--
-- An toan: bon cot nay deu la KET QUA BOC tu `bai_keo_tho.du_lieu`. Xoa di roi
-- chay lai bo boc la dung lai duoc, khong ton mot luot goi Apify nao.

BEGIN;

ALTER TABLE "bai_keo_tho" DROP COLUMN IF EXISTS "thoi_luong_video_ms";
ALTER TABLE "bai_keo_tho" DROP COLUMN IF EXISTS "so_chia_se";
ALTER TABLE "bai_keo_tho" DROP COLUMN IF EXISTS "so_binh_luan";
ALTER TABLE "bai_keo_tho" DROP COLUMN IF EXISTS "so_thich";

DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
