-- Hoan tac migration 0000_stormy_zombie (tao toan bo bang V1).
-- Xoa sach schema public. CHI chay khi da chac chan database khong con du lieu
-- can giu, va CHI sau khi da co ban pg_dump ngay truoc do.
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev \
--     < db/rollback/0000_stormy_zombie.down.sql

BEGIN;

DROP TABLE IF EXISTS pillar_stats CASCADE;
DROP TABLE IF EXISTS effectiveness_scores CASCADE;
DROP TABLE IF EXISTS comment_classifications CASCADE;
DROP TABLE IF EXISTS comments_raw CASCADE;
DROP TABLE IF EXISTS metric_snapshots CASCADE;
DROP TABLE IF EXISTS quality_scores CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS che_do_xem CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS trend_signals CASCADE;
DROP TABLE IF EXISTS kenh_dang CASCADE;
DROP TABLE IF EXISTS cost_log CASCADE;
DROP TABLE IF EXISTS credit_ledger CASCADE;
DROP TABLE IF EXISTS model_runs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS content_pillars CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brand_profiles CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS oauth_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS trang_thai_snapshot;
DROP TYPE IF EXISTS nhom_y_dinh;
DROP TYPE IF EXISTS nguon_so_lieu;
DROP TYPE IF EXISTS moc_do_luong;
DROP TYPE IF EXISTS trang_thai_theo_doi;
DROP TYPE IF EXISTS trang_thai_noi_dung;
DROP TYPE IF EXISTS nguon_y_tuong;
DROP TYPE IF EXISTS ly_do_bo;
DROP TYPE IF EXISTS loai_asset;
DROP TYPE IF EXISTS dang_bai;
DROP TYPE IF EXISTS be_mat;
DROP TYPE IF EXISTS trang_thai_job;
DROP TYPE IF EXISTS nhiem_vu_mo_hinh;
DROP TYPE IF EXISTS loai_viec;
DROP TYPE IF EXISTS loai_chi_phi;
DROP TYPE IF EXISTS vai_tro_thanh_vien;

-- Xoa dau chan cua migration nay de `npm run db:migrate` chay lai duoc tu dau.
DELETE FROM drizzle."__drizzle_migrations"
WHERE id = (SELECT max(id) FROM drizzle."__drizzle_migrations");

COMMIT;
