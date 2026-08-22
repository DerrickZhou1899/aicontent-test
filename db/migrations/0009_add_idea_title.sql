ALTER TABLE "ideas" ADD COLUMN "tieu_de" text;
UPDATE "ideas" SET "tieu_de" = COALESCE("cau_mo_dau", "goc_tiep_can", 'Ý tưởng nội dung');
ALTER TABLE "ideas" ALTER COLUMN "tieu_de" SET NOT NULL;
