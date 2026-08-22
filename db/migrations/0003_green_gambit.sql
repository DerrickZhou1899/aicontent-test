-- Siet 4 bat bien do luong. Xem plans/260813-0053-siet-bat-bien-schema-do-luong/plan.md
--
-- SUA TAY hai cho so voi ban `drizzle-kit generate` sinh ra:
--   1. Doi thu tu: drizzle dat ADD CONSTRAINT ... FOREIGN KEY TRUOC cac UNIQUE ma
--      chung tro vao. PostgreSQL doi bo cot duoc tham chieu phai co UNIQUE san,
--      nen chay nguyen ban sinh ra la loi ngay cau lenh dau tien.
--   2. Them trigger chan sua/xoa `metric_snapshots` — drizzle-kit khong sinh trigger.

ALTER TABLE "effectiveness_scores" DROP CONSTRAINT "effectiveness_scores_content_id_contents_id_fk";
--> statement-breakpoint
ALTER TABLE "effectiveness_scores" DROP CONSTRAINT "effectiveness_scores_snapshot_id_metric_snapshots_id_fk";
--> statement-breakpoint
ALTER TABLE "metric_snapshots" DROP CONSTRAINT "metric_snapshots_content_id_contents_id_fk";
--> statement-breakpoint
ALTER TABLE "effectiveness_scores" ADD COLUMN "snapshot_status" "trang_thai_snapshot" NOT NULL;--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD COLUMN "be_mat" "be_mat" NOT NULL;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_workspace_id_be_mat_key" UNIQUE("workspace_id","id","be_mat");--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_workspace_id_status_key" UNIQUE("workspace_id","id","status");--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_content_id_key" UNIQUE("content_id","id");--> statement-breakpoint
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_content_fk" FOREIGN KEY ("workspace_id","content_id","be_mat") REFERENCES "public"."contents"("workspace_id","id","be_mat") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_snapshot_fk" FOREIGN KEY ("workspace_id","snapshot_id","snapshot_status") REFERENCES "public"."metric_snapshots"("workspace_id","id","status") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_content_fk" FOREIGN KEY ("content_id","snapshot_id") REFERENCES "public"."metric_snapshots"("content_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "effectiveness_scores" ADD CONSTRAINT "effectiveness_scores_chi_cham_ban_do_duoc" CHECK ("effectiveness_scores"."snapshot_status" = 'co_du_lieu');--> statement-breakpoint
CREATE OR REPLACE FUNCTION chan_sua_metric_snapshots() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- DELETE day chuyen tu viec xoa ca workspace thi cho qua. Rang buoc khoa ngoai
  -- cua PostgreSQL chay nhu trigger noi bo, nen luc do trigger nay nam o tang 2;
  -- goi DELETE thang tay thi no nam o tang 1.
  --
  -- Phan biet nhu vay vi hai viec khac han nhau: xoa ca khong gian lam viec la
  -- go han mot khach hang, co chu y va thay duoc. Xoa le tung ban chup la sua
  -- lich su do luong trong im lang — dung thu can chan.
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'metric_snapshots chi ghi them: % bi chan', TG_OP
    USING ERRCODE = 'restrict_violation',
          HINT = 'Moi luot keo ghi mot ban chup moi. Bo bai thi dat contents.trang_thai = ''da_bo''.';
END;
$$;--> statement-breakpoint
-- Chan ca UPDATE lan DELETE, khong chi rieng cot `raw_payload`: cho sua
-- `thich`/`binh_luan` ma cam sua `raw_payload` la bat bien nua voi — so da boc
-- lech so tho thi trung vi van ban, chi kho lan ra hon.
CREATE TRIGGER metric_snapshots_chi_ghi_them
  BEFORE UPDATE OR DELETE ON "metric_snapshots"
  FOR EACH ROW EXECUTE FUNCTION chan_sua_metric_snapshots();
