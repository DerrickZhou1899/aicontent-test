-- Du lieu toi thieu de cac phase sau co cai ma chay thu: 1 nguoi dung,
-- 1 khong gian lam viec, 5 tru cot noi dung mau.
--
-- CHI chay tren database THU (`aicontent_dev`). Chay tren `aicontent` la nhet
-- du lieu gia vao du lieu that.
--   docker exec -i aicontent-postgres psql -U postgres -d aicontent_dev < db/seed.sql
--
-- Ma dinh danh co dinh de chay lai nhieu lan khong sinh ban trung.

BEGIN;

INSERT INTO users (id, ten, email, ngay_tao)
VALUES ('00000000-0000-4000-8000-000000000001', 'Nhan su noi dung', 'seed@aicontent.local', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspaces (id, ten, chu_so_huu_id, ngon_ngu, mui_gio)
VALUES ('00000000-0000-4000-8000-000000000002', 'SANG 5M STUDIO',
        '00000000-0000-4000-8000-000000000001', 'vi', 'Asia/Ho_Chi_Minh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspace_members (workspace_id, user_id, vai_tro)
VALUES ('00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000001', 'chu_so_huu')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Nam tru cot mau. "Xay long tin" bat khoa khong tu giam: diem ngan han cua no
-- luon thap, khong khoa lai thi may de xuat se tu cat mat tuyen nuoi duong.
INSERT INTO content_pillars (workspace_id, ten, muc_dich, ti_le_muc_tieu, khoa_khong_tu_giam)
SELECT '00000000-0000-4000-8000-000000000002', v.ten, v.muc_dich, v.ti_le, v.khoa
FROM (VALUES
  ('Xay long tin',      'Ke chuyen that, hau truong, khach that',        30.00, true),
  ('Chi meo huu ich',   'Day mot viec lam duoc ngay sau khi doc',        25.00, false),
  ('Bang chung ket qua','Truoc - sau, so lieu that cua khach',           20.00, false),
  ('Chao ban',          'Gioi thieu san pham va loi keu goi ro rang',    15.00, false),
  ('Bat xu huong',      'Bam su kien dang nong, giu dung giong kenh',    10.00, false)
) AS v(ten, muc_dich, ti_le, khoa)
WHERE NOT EXISTS (
  SELECT 1 FROM content_pillars p
  WHERE p.workspace_id = '00000000-0000-4000-8000-000000000002' AND p.ten = v.ten
);

COMMIT;
