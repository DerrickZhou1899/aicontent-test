-- Hoan tac migration 0004_unusual_callisto (hai cot chuoi bai).
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0004_unusual_callisto.down.sql
--
-- CANH BAO: chay ban nay XOA lien ket chuoi bai. Cac bai van con nguyen ven,
-- nhung "bai nao thuoc chuoi nao, thu tu may" thi mat han va khong dung lai
-- duoc tu du lieu con lai. Kiem truoc:
--   SELECT count(*) FROM contents WHERE chuoi_id IS NOT NULL;

BEGIN;

ALTER TABLE "contents" DROP CONSTRAINT IF EXISTS "contents_chuoi_bai_di_theo_cap";
ALTER TABLE "contents" DROP CONSTRAINT IF EXISTS "contents_chuoi_thu_tu_key";
ALTER TABLE "contents" DROP COLUMN IF EXISTS "thu_tu_trong_chuoi";
ALTER TABLE "contents" DROP COLUMN IF EXISTS "chuoi_id";

DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
