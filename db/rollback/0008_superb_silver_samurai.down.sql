-- Hoan tac migration 0008_superb_silver_samurai (chi muc rieng phan cho vong boc).
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0008_superb_silver_samurai.down.sql
--
-- An toan tuyet doi: chi muc khong giu du lieu. Bo di chi lam vong chon bai
-- chua boc cham hon, khong mat gi.

BEGIN;

DROP INDEX IF EXISTS "trend_signals_chua_boc_idx";

DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
