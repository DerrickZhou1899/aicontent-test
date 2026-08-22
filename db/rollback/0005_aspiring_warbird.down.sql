-- Hoan tac migration 0005_aspiring_warbird (bai keo ve tu nen tang ngoai).
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0005_aspiring_warbird.down.sql
--
-- CANH BAO: XOA toan bo ban tho cua bai da keo. Keo lai la TON TIEN THAT (Apify
-- tinh theo luot). Kiem truoc:
--   SELECT count(*) FROM bai_keo_tho;
--   SELECT count(*) FROM assets WHERE url_ngoai IS NOT NULL AND duong_dan IS NULL;
-- Dong thu hai la so asset chi ton tai duoi dang lien ket ngoai — dua duong_dan
-- ve NOT NULL se lam lenh nay HONG neu con dong nao nhu vay. Xoa chung truoc.

BEGIN;

DROP TABLE IF EXISTS "bai_keo_tho";

ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_phai_co_duong_dan_hoac_url";
ALTER TABLE "assets" DROP COLUMN IF EXISTS "phu_de";
ALTER TABLE "assets" DROP COLUMN IF EXISTS "url_ngoai";
ALTER TABLE "assets" ALTER COLUMN "duong_dan" SET NOT NULL;

DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
