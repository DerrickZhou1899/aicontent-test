/**
 * Chot kiem cua tang truy cap du lieu.
 *
 * Bo Supabase la bo phan quyen theo hang lam san. Thu duy nhat con lai chan ro
 * du lieu giua cac khong gian lam viec la: KHONG CO CACH NAO cam duoc mot repo
 * ma thieu `workspaceId`. File nay la cho duy nhat quyet dinh gia tri nao du
 * tieu chuan.
 */

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '@/db/schema/index';

/** Ban Drizzle da gan luoc do — moi ham repo nhan kieu nay lam tham so dau. */
export type KetNoiDrizzle = NodePgDatabase<typeof schema>;

/** Moi doi tuong repo deu mang theo pham vi cua chinh no de doc log de truy. */
export type WorkspaceScoped = { readonly workspaceId: string };

/**
 * Nem loi khi `workspaceId` khong dung duoc. Bat buoc nem chu khong tra ve
 * `null`: gia tri khong hop le ma van chay tiep nghia la truy van chay khong
 * dieu kien loc — dung mot lan la ro du lieu ca he thong.
 *
 * KHONG kiem dinh dang UUID o day. Cot `workspace_id` la kieu uuid nen
 * PostgreSQL tu tu choi chuoi sai dinh dang; them mot lop kiem nua chi lam
 * thong bao loi kho hieu hon chu khong chan them duoc gi.
 */
export function kiemWorkspaceId(giaTri: unknown): string {
  if (typeof giaTri !== 'string' || giaTri.trim() === '') {
    throw new Error('workspaceId bat buoc');
  }
  return giaTri;
}

/**
 * Truc co lap THU HAI: nguoi dung trong cung mot workspace.
 *
 * Danh sach kenh theo doi la rieng tung nguoi, nen mot truy van thieu `user_id`
 * lam B doc duoc tin hieu cua kenh A theo doi. Truc `workspace_id` duoc ep o ba
 * lop (ham nay, nha may `createRepo`, bo quet AST trong `tests/`); truc nguoi
 * dung khong the dua vao mot minh bo quet vi `userId` la chuoi tran — doi nham
 * thu tu `bat(kenhId, userId)` van bien dich duoc va van chay.
 *
 * Nen boc no vao kieu co nhan. Doi thu tu tham so gio la loi BIEN DICH, khong
 * phai loi chay. Chi `lib/auth/current-workspace.ts` duoc dung kieu nay, dung
 * cho va dung cach `workspaceHienTai()` dang lam.
 */
declare const NHAN_TU_PHIEN: unique symbol;

export type NguoiDungTuPhien = {
  readonly userId: string;
  /**
   * Nhan chong dung nham. `unique symbol` khai bao chu KHONG hien thuc, nen
   * khong doan nao ngoai `kiemUserId()` tao duoc gia tri hop kieu — ke ca viet
   * tay `{ userId: form.get('userId'), tuPhien: true }`.
   *
   * Ban dau nhan nay la `tuPhien: true`, va nhu the la CHUA DU: TypeScript so
   * kieu theo CAU TRUC, nen mot doi tuong viet tay dung hinh dang van qua duoc
   * kiem kieu ma khong he di qua `kiemUserId()`. Bo quet AST chi chan loi goi
   * `kiemUserId(` sai cho, khong chan duoc viec tu dung doi tuong.
   */
  readonly [NHAN_TU_PHIEN]: true;
};

export function kiemUserId(giaTri: unknown): NguoiDungTuPhien {
  if (typeof giaTri !== 'string' || giaTri.trim() === '') {
    throw new Error('userId bat buoc');
  }
  return { userId: giaTri } as NguoiDungTuPhien;
}
