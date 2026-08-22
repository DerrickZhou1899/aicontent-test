-- Ghi cac rang buoc nghiep vu khong ep duoc bang khoa/kieu du lieu vao chinh
-- CSDL. Nguoi doc `\d+ bang` hoac cong cu quan tri se thay ngay, thay vi phai
-- di tim trong tai lieu.

COMMENT ON COLUMN "metric_snapshots"."status" IS
  'co_du_lieu | khong_do_duoc | loi | chua_toi_han. CHI status=co_du_lieu moi duoc sinh dong trong effectiveness_scores. Bai khong do duoc (de che do ban be, bi xoa, nen tang khong cho lay) TUYET DOI khong duoc cham 0 diem: cham 0 lam he thong tuong ca tuyen noi dung do vo dung roi ngung de xuat.';
--> statement-breakpoint
COMMENT ON COLUMN "metric_snapshots"."raw_payload" IS
  'Du lieu tho nguyen van tu Apify. BAT BIEN: chi INSERT ban chup moi, khong bao gio UPDATE. Khi bo boc truong hong thi viet lai roi chay lai toan bo lich su tu cot nay.';
--> statement-breakpoint
COMMENT ON COLUMN "effectiveness_scores"."formula_version" IS
  'Phien ban cong thuc trong so da dung. Doi cong thuc = tang so nay va chay lenh tinh lai toan bo lich su, giu ca diem cu de so. Khong bao gio ghi de diem cu.';
--> statement-breakpoint
COMMENT ON COLUMN "contents"."lien_ket_goc" IS
  'Lien ket bai dang NGUYEN VAN nguoi dung dan vao, khong chuan hoa. La bao hiem khi cach boc ma bai hong (Facebook doi dang lien ket).';
--> statement-breakpoint
COMMENT ON COLUMN "contents"."ma_bai" IS
  'Ma bai boc tu lien_ket_goc. Cho NULL va cho nguoi dung nhap tay — day la duong thoat khi boc tu dong that bai.';
--> statement-breakpoint
COMMENT ON COLUMN "contents"."parent_content_id" IS
  'Mot noi dung dang len hai be mat = hai dong noi dung rieng, noi voi nhau qua cot nay.';
--> statement-breakpoint
COMMENT ON COLUMN "content_pillars"."khoa_khong_tu_giam" IS
  'true = may de xuat khong duoc tu ha ti le muc tieu cua tru cot nay du diem ngan han thap (tru cot nuoi duong).';
--> statement-breakpoint
COMMENT ON COLUMN "jobs"."idempotency_key" IS
  'Khoa chong chay trung. Voi viec keo so lieu: content_id + moc. Apify tinh tien theo luot chay nen chan trung phai o tang CSDL. NULL cho cac viec khong can chong trung.';
--> statement-breakpoint
COMMENT ON CONSTRAINT "oauth_accounts_provider_tai_khoan_key" ON "oauth_accounts" IS
  'Email Google doi duoc, provider_account_id (sub) thi khong. Khong bao gio dat khoa duy nhat tren email cua bang nay.';
