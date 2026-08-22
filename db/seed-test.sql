-- Du lieu mau cho BAI TEST — chay SAU `db/seed.sql`.
--
--   docker exec -i aicontent-test-postgres psql -U postgres -d aicontent_test < db/seed.sql
--   docker exec -i aicontent-test-postgres psql -U postgres -d aicontent_test < db/seed-test.sql
--
-- `db/seed.sql` tao san nguoi dung, khong gian lam viec va nam tru cot. Tep nay
-- do them BON NGUON DAU VAO ma tinh nang can:
--   1. ho so thuong hieu + chan dung khach hang   -> brand_profiles, personas
--   2. insight khach hang                          -> insights
--   3. lich su bai da dang cua kenh minh           -> contents (trang_thai='da_dang')
--   4. lich su bai cua nguoi minh follow           -> kenh_theo_doi + bai_keo_tho
--
-- Ma dinh danh co dinh de chay lai nhieu lan khong sinh ban trung.
--
-- Du lieu o day la BIA RA cho viec chay thu. No du de tinh nang chay va du de
-- nhin ra ket qua co hop ly khong, nhung no khong phai giong that cua mot kenh
-- nao ca — dung lay no lam chuan danh gia chat luong cau chu.

BEGIN;

-- Rut gon: moi cau lenh duoi day deu gan vao khong gian lam viec cua seed.sql.
\set ws '''00000000-0000-4000-8000-000000000002'''
\set nguoi '''00000000-0000-4000-8000-000000000001'''

-- ---------------------------------------------------------------------------
-- 1. Ho so thuong hieu + chan dung khach hang
-- ---------------------------------------------------------------------------

-- `do_day_du` = 100: may de xuat CHAN khi ho so con rong, nen de thap la khong
-- chay thu duoc. Xem `lib/brand/do-day-du.ts` de biet cach tinh diem that.
INSERT INTO brand_profiles (workspace_id, mo_ta, giong_dieu, dieu_cam_ky, do_day_du)
VALUES (
  :ws,
  'Xuong dung video ngan cho chu shop nho: quay bang dien thoai, dung san theo mau, giao trong 24 gio.',
  'Noi chuyen nhu dan trong nghe: cau ngan, so lieu that, khong tang boc. Xung "minh" - goi "ban".',
  'Khong hua doanh so. Khong che doi thu. Khong dung tu "bung no", "than toc", "chan dong".',
  100
)
ON CONFLICT (workspace_id) DO NOTHING;

INSERT INTO personas (id, workspace_id, ten, do_tuoi, nghe_nghiep, noi_dau, mong_muon, cau_noi_thuong_dung)
VALUES
  ('00000000-0000-4000-8000-000000000101', :ws,
   'Chi Ha ban do an nha lam', '28-38', 'Chu shop online mot minh',
   'Quay xong khong biet dung, de trong may ca thang roi quen luon.',
   'Moi tuan dang deu duoc vai video ma khong ton them nguoi.',
   'Lam gi co thoi gian ma ngoi dung.'),
  ('00000000-0000-4000-8000-000000000102', :ws,
   'Anh Tuan chuoi 3 cua hang', '35-45', 'Chu chuoi ban le',
   'Thue nguoi dung video thi dat, ma chat luong moi thang moi kieu.',
   'Ra video deu tay, nhin la biet cua thuong hieu minh.',
   'Cai nay thang truoc lam dep hon.'),
  ('00000000-0000-4000-8000-000000000103', :ws,
   'Em Linh moi mo shop', '22-27', 'Ban hang online tu nam nay',
   'Xem huong dan tren mang xong van khong biet bat dau tu dau.',
   'Co mot quy trinh don gian lam theo la ra bai.',
   'Nguoi ta lam sao ma nhanh vay?')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Insight khach hang
-- ---------------------------------------------------------------------------

INSERT INTO insights (id, workspace_id, noi_dung, bang_chung, nguon)
VALUES
  ('00000000-0000-4000-8000-000000000201', :ws,
   'Khach so nhat khong phai gia ma la "gui file xong roi im luon".',
   '7/10 cuoc goi tu van thang nay deu hoi "bao lau thi co bai" truoc khi hoi gia.',
   'Ghi chu cuoc goi tu van'),
  ('00000000-0000-4000-8000-000000000202', :ws,
   'Video co mat nguoi that o 3 giay dau giu chan tot hon han video chi co san pham.',
   'So lieu 12 bai gan nhat: co mat nguoi giu chan trung binh cao hon ro ret.',
   'Thong ke bai da dang'),
  ('00000000-0000-4000-8000-000000000203', :ws,
   'Chu shop nho khong tim "dich vu dung video", ho tim "cach lam video ban hang".',
   'Tu khoa vao website 3 thang gan nhat gan nhu toan dang huong dan tu lam.',
   'Tu khoa tim kiem')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Lich su bai da dang cua kenh minh
-- ---------------------------------------------------------------------------
--
-- Gan pillar_id/persona_id bang cach TRA THEO TEN chu khong ghi ma cung: nam
-- tru cot trong `seed.sql` de he tu sinh ma, ghi cung o day la lech.

INSERT INTO contents (
  id, workspace_id, be_mat, pillar_id, persona_id, nguon_y_tuong,
  goc_tiep_can, cau_mo_dau, noi_dung, trang_thai, nguoi_tao, ngay_dang
)
SELECT
  v.id, :ws, v.be_mat::be_mat, p.id, v.persona_id, 'nguoi-tu-nhap'::nguon_y_tuong,
  v.goc, v.mo_dau, v.noi_dung, 'da_dang'::trang_thai_noi_dung, :nguoi,
  now() - (v.ngay_truoc || ' days')::interval
FROM (VALUES
  ('00000000-0000-4000-8000-000000000301'::uuid, 'fanpage', 'Xay long tin',
   '00000000-0000-4000-8000-000000000101'::uuid,
   'Hau truong mot ngay dung bai',
   'Chi Ha gui 47 doan video quay bang dien thoai, khong doan nao du 10 giay.',
   'Chi Ha gui 47 doan video quay bang dien thoai, khong doan nao du 10 giay. Minh ngoi lai ca buoi chieu, cat ra duoc 3 bai dang duoc. Cai kho khong phai la thieu canh quay — la khong ai noi cho chi biet canh nao dung duoc.', 21),
  ('00000000-0000-4000-8000-000000000302'::uuid, 'fanpage', 'Chi meo huu ich',
   '00000000-0000-4000-8000-000000000103'::uuid,
   'Mot viec lam duoc ngay',
   'Quay xong dung tat may: quay them 5 giay canh trong.',
   'Quay xong dung tat may: quay them 5 giay canh trong. Doan do de lam cho chuyen canh, khong co no thi bai nao cung giat cuc. Mat 5 giay, tiet kiem ca buoi ngoi tim canh chen.', 18),
  ('00000000-0000-4000-8000-000000000303'::uuid, 'tiktok', 'Bang chung ket qua',
   '00000000-0000-4000-8000-000000000102'::uuid,
   'Truoc - sau',
   'Cung mot canh quay, khac moi cach dung.',
   'Cung mot canh quay, khac moi cach dung. Ben trai la ban anh Tuan tu dung, ben phai la ban minh dung lai. Khong them canh nao moi, chi doi thu tu va cat bot 4 giay dau.', 14),
  ('00000000-0000-4000-8000-000000000304'::uuid, 'fanpage', 'Chi meo huu ich',
   '00000000-0000-4000-8000-000000000101'::uuid,
   'Chuoi 3 buoc',
   'Ba cau hoi truoc khi bam quay, tra loi duoc het thi quay.',
   'Ba cau hoi truoc khi bam quay: bai nay cho ai xem, xem xong ho lam gi, va canh nao chung minh duoc dieu minh noi. Tra loi duoc het ba cau thi quay. Khong tra loi duoc thi quay xong cung bo.', 9),
  ('00000000-0000-4000-8000-000000000305'::uuid, 'ho_so_ca_nhan', 'Xay long tin',
   '00000000-0000-4000-8000-000000000102'::uuid,
   'Ke that mot lan lam hong',
   'Thang truoc minh giao tre 2 ngay cho mot khach.',
   'Thang truoc minh giao tre 2 ngay cho mot khach. Ly do that: nhan qua nhieu bai trong mot tuan ma khong tinh lai suc. Minh da hoan tien phan cham va gio chi nhan toi da 12 bai mot tuan. Viet ra day de nho.', 5),
  ('00000000-0000-4000-8000-000000000306'::uuid, 'fanpage', 'Chao ban',
   '00000000-0000-4000-8000-000000000103'::uuid,
   'Loi keu goi truc tiep',
   'Con 4 suat cho thang nay.',
   'Con 4 suat cho thang nay. Goi dung 10 bai, giao trong 24 gio moi bai, sua lai 1 lan mien phi. Ai dang co san canh quay ma chua dung thi nhan tin, minh xem truoc mien phi roi bao lam duoc bao nhieu bai.', 2)
) AS v(id, be_mat, ten_pillar, persona_id, goc, mo_dau, noi_dung, ngay_truoc)
JOIN content_pillars p ON p.workspace_id = :ws AND p.ten = v.ten_pillar
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Lich su bai cua nguoi minh follow
-- ---------------------------------------------------------------------------
--
-- Bai cua kenh MINH FOLLOW nam o `trend_signals`, khong phai `bai_keo_tho`.
-- `bai_keo_tho` la ban tho cua bai CHINH MINH da dang, keo ve de do so lieu.
--
-- `cong_thuc` de NULL co chu y: do la ket qua boc cong thuc ke, do
-- `lib/studio/boc-cong-thuc.ts` sinh ra khi chay. De san ket qua vao thi khong
-- con nhin thay buoc do chay nua.

INSERT INTO kenh_theo_doi (id, workspace_id, be_mat, url_kenh, ten_hien_thi, lan_keo_cuoi)
VALUES
  ('00000000-0000-4000-8000-000000000401', :ws, 'fanpage',
   'https://www.facebook.com/xuongdungvideo.demo', 'Xuong dung video (demo)', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000402', :ws, 'tiktok',
   'https://www.tiktok.com/@meobanhang.demo', 'Meo ban hang (demo)', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO theo_doi_cua_toi (workspace_id, user_id, kenh_theo_doi_id)
VALUES
  (:ws, :nguoi, '00000000-0000-4000-8000-000000000401'),
  (:ws, :nguoi, '00000000-0000-4000-8000-000000000402')
ON CONFLICT (workspace_id, user_id, kenh_theo_doi_id) DO NOTHING;

INSERT INTO trend_signals (
  workspace_id, kenh_theo_doi_id, nguon, ma_bai, tieu_de, noi_dung, lien_ket,
  dang_bai, thoi_diem, so_thich, so_binh_luan, so_chia_se, thoi_luong_video_ms, tho
)
SELECT
  :ws, v.kenh::uuid, v.nguon, v.ma_bai,
  -- `tieu_de` not null: lay cau dau cua bai lam tieu de, giong luc keo that.
  left(v.noi_dung, 80), v.noi_dung, v.lien_ket,
  v.dang_bai::dang_bai, now() - (v.ngay_truoc || ' days')::interval,
  v.thich, v.binh_luan, v.chia_se, v.thoi_luong,
  jsonb_build_object('text', v.noi_dung, 'url', v.lien_ket)
FROM (VALUES
  ('00000000-0000-4000-8000-000000000401', 'fanpage', 'demo-fb-0001',
   'Khach hay hoi bao lau co bai. Minh tra loi bang mot cai bang: nhan sang, gui chieu, sua trong ngay hom sau. Khong hua nhanh hon, va chua tre lan nao trong 3 thang.',
   'https://www.facebook.com/xuongdungvideo.demo/posts/1', 'chu', 6, 482, 63, 21, NULL::integer),
  ('00000000-0000-4000-8000-000000000401', 'fanpage', 'demo-fb-0002',
   '3 loi lam bai quang cao chet ngay 3 giay dau: mo bang logo, mo bang nhac, mo bang cau chao. Doi lai bang mot canh dang lam do — giu chan gap doi.',
   'https://www.facebook.com/xuongdungvideo.demo/posts/2', 'anh_chu', 4, 1207, 148, 96, NULL),
  ('00000000-0000-4000-8000-000000000401', 'fanpage', 'demo-fb-0003',
   'Hom nay tra bai cho mot ban moi mo shop. Ban ay gui 6 canh quay, minh dung ra 4 bai. Dang len de ai dang phan van co du canh khong thi nhin cho de hinh dung.',
   'https://www.facebook.com/xuongdungvideo.demo/posts/3', 'chu', 2, 339, 27, 8, NULL),
  ('00000000-0000-4000-8000-000000000402', 'tiktok', 'demo-tt-0001',
   'Quay 1 lan dung duoc 5 bai — chia canh theo cong thuc nay',
   'https://www.tiktok.com/@meobanhang.demo/video/1', 'kich_ban_quay', 8, 8940, 412, 733, 41000),
  ('00000000-0000-4000-8000-000000000402', 'tiktok', 'demo-tt-0002',
   'Dung app dien thoai lam bai ban hang trong 7 phut, khong can may tinh',
   'https://www.tiktok.com/@meobanhang.demo/video/2', 'kich_ban_quay', 3, 15220, 806, 1904, 58000),
  ('00000000-0000-4000-8000-000000000402', 'tiktok', 'demo-tt-0003',
   'Cau mo dau nao dang chay tot thang nay — minh thu 12 kieu va giu lai 3',
   'https://www.tiktok.com/@meobanhang.demo/video/3', 'kich_ban_quay', 1, 6180, 233, 388, 36000)
) AS v(kenh, nguon, ma_bai, noi_dung, lien_ket, dang_bai, ngay_truoc, thich, binh_luan, chia_se, thoi_luong)
ON CONFLICT (kenh_theo_doi_id, ma_bai) DO NOTHING;

COMMIT;
