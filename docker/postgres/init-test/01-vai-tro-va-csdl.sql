-- Tao vai tro va co so du lieu cho BAI TEST.
--
-- Tep nay chi chay MOT LAN, luc container tao volume du lieu lan dau (co che
-- `docker-entrypoint-initdb.d` cua image postgres). Sua tep roi chay lai ma
-- khong thay gi doi thi la volume cu con do:
--   docker compose -f docker/postgres/compose.yml down -v
--
-- Mat khau o day co dinh va nam trong ma nguon MOT CACH CO Y: day la co so du
-- lieu chay tren may ban, chi mo cong ra 127.0.0.1, va khong chua du lieu that
-- cua ai. Ban that dat mat khau qua bien moi truong va khong commit bao gio.

-- Vai tro cua ung dung web. KHONG co BYPASSRLS: khi Phase 13 bat Row Level
-- Security len, chinh vai tro nay la thu bi chan.
CREATE ROLE aicontent_app WITH LOGIN PASSWORD 'aicontent_test';

-- Vai tro cua worker. Worker chay viec nen cho MOI khong gian lam viec nen no
-- phai di xuyen qua phan quyen theo khong gian — do la ly do duy nhat no ton
-- tai tach khoi vai tro tren. App KHONG duoc dung chuoi ket noi cua vai tro nay.
CREATE ROLE aicontent_worker WITH LOGIN PASSWORD 'aicontent_test' BYPASSRLS;

CREATE DATABASE aicontent_test OWNER aicontent_app;

\connect aicontent_test

-- Hai extension nay la BAT BUOC, thieu la migration dung giua chung:
--   pgcrypto — `gen_random_uuid()`, khoa chinh cua gan het cac bang
--   pg_trgm  — lop toan tu `gin_trgm_ops` cua chi muc tim kiem van ban
-- Phai tao o day chu khong o migration: tao extension can quyen superuser, ma
-- `aicontent_app` co y khong duoc cap quyen do.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Worker doc/ghi cung bo bang voi app, nen no can quyen tren schema `public`
-- va tren MOI bang sinh ra ve sau boi migration cua app.
GRANT ALL ON SCHEMA public TO aicontent_app, aicontent_worker;
ALTER DEFAULT PRIVILEGES FOR ROLE aicontent_app IN SCHEMA public
  GRANT ALL ON TABLES TO aicontent_worker;
ALTER DEFAULT PRIVILEGES FOR ROLE aicontent_app IN SCHEMA public
  GRANT ALL ON SEQUENCES TO aicontent_worker;
