/**
 * Repo bang `brand_profiles` — giong dieu, dieu cam ky, mo ta thuong hieu.
 *
 * Khac bon nhom kia: moi khong gian lam viec chi co MOT dong (khoa duy nhat
 * `brand_profiles_workspace_id_key`), nen khong dung khuon CRUD danh sach.
 * Nguoi dung khong "tao" ho so — ho mo trang ra la da co san mot cai rong.
 */

import { eq } from 'drizzle-orm';

import { brandProfiles } from '@/db/schema/index';

import type { KetNoiDrizzle } from './guard';

export type HoSoThuongHieu = typeof brandProfiles.$inferSelect;

/** Cac o nguoi dung sua duoc. `doDayDu` khong nam trong day — xem ghi chu duoi. */
export type SuaHoSo = Partial<
  Pick<HoSoThuongHieu, 'moTa' | 'giongDieu' | 'dieuCamKy' | 'mauSac' | 'phongChu'>
>;

export function brandProfilesRepo(db: KetNoiDrizzle, workspaceId: string) {
  return {
    async lay(): Promise<HoSoThuongHieu | null> {
      const [dong] = await db
        .select()
        .from(brandProfiles)
        .where(eq(brandProfiles.workspaceId, workspaceId))
        .limit(1);
      return dong ?? null;
    },

    /**
     * Doc ho so, tu tao dong rong neu chua co. Dung `onConflictDoNothing` chu
     * khong phai "doc roi neu rong thi ghi": hai tab mo cung luc thi cach sau
     * ghi hai dong, ma khoa duy nhat se nem loi vao mat nguoi dung.
     */
    async layHoacTao(): Promise<HoSoThuongHieu> {
      const dangCo = await this.lay();
      if (dangCo) return dangCo;

      await db.insert(brandProfiles).values({ workspaceId }).onConflictDoNothing();
      const vuaTao = await this.lay();
      if (!vuaTao) throw new Error('khong tao duoc ho so thuong hieu');
      return vuaTao;
    },

    async luu(giaTri: SuaHoSo): Promise<HoSoThuongHieu> {
      await this.layHoacTao();
      const [dong] = await db
        .update(brandProfiles)
        .set({ ...giaTri, capNhat: new Date() })
        .where(eq(brandProfiles.workspaceId, workspaceId))
        .returning();
      return dong;
    },
  };
}
