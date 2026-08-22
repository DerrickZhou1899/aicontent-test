-- Hoan tac migration 0007_pretty_eddie_brock (theo doi kenh ngoai).
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0007_pretty_eddie_brock.down.sql
--
-- An toan lan dau: ca hai bang moi deu rong, va 10 cot them vao `trend_signals`
-- cung rong (bang do co tu Phase 3 nhung khong mã ứng dụng nao ghi vao).
--
-- CHAY LUI SAU KHI DA KEO DU LIEU THAT thi MAT toan bo bai kenh ngoai da mua
-- bang tien Apify — dataset goc cung da bi Apify xoa sau 7 ngay. Dump truoc.
--
-- Thu tu nguoc voi luc len: rang buoc -> chi muc -> cot -> bang con -> bang cha.

BEGIN;

ALTER TABLE "trend_signals" DROP CONSTRAINT IF EXISTS "trend_signals_kenh_ma_bai_key";
DROP INDEX IF EXISTS "trend_signals_kenh_thoi_diem_idx";
ALTER TABLE "trend_signals" DROP CONSTRAINT IF EXISTS "trend_signals_kenh_theo_doi_id_kenh_theo_doi_id_fk";

ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "tho";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "cong_thuc";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "thoi_luong_video_ms";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "so_chia_se";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "so_binh_luan";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "so_thich";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "dang_bai";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "noi_dung";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "ma_bai";
ALTER TABLE "trend_signals" DROP COLUMN IF EXISTS "kenh_theo_doi_id";

-- `theo_doi_cua_toi` truoc: no tro toi `kenh_theo_doi`.
DROP TABLE IF EXISTS "theo_doi_cua_toi";
DROP TABLE IF EXISTS "kenh_theo_doi";

DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
