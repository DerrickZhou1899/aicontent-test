/**
 * Cau hinh dang nhap Google (Auth.js v5) — goc cua moi thu co `workspace_id`.
 *
 * Day la file DUY NHAT cua Phase 6 duoc import `db` truc tiep: DrizzleAdapter
 * bat buoc nhan mot ket noi Drizzle. Bon bang Auth.js (`users`,
 * `oauth_accounts`, `sessions`, `verification_tokens`) khong co cot
 * `workspace_id` nen khong co gi de ro cheo giua cac khong gian lam viec. Moi
 * truy van nghiep vu khac phai di qua tang truy cap du lieu cua Phase 5.
 */

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

import { db } from '@/db/client';
import {
  oauthAccounts,
  sessions,
  users,
  verificationTokens,
  workspaceMembers,
  workspaces,
} from '@/db/schema/auth';
import { emailDuocPhep } from '@/lib/auth/danh-sach-email-cho-phep.mjs';

declare module '@auth/core/types' {
  interface Session {
    /** Khong gian lam viec cua nguoi dung. `null` khi phien hong (khong nen xay ra). */
    workspaceId: string | null;
  }
}

/** Hinh dang luoc do ma DrizzleAdapter nhan. Lay tu chinh chu ky ham vi goi
 *  `@auth/drizzle-adapter` chi mo duong dan goc, khong mo `./lib/pg`. */
type LuocDoAuth = NonNullable<Parameters<typeof DrizzleAdapter<typeof db>>[1]>;

/**
 * Lech kieu da biet, KHONG phai lech cot.
 *
 * Adapter khai bao `sessions.sessionToken` la khoa chinh; schema Phase 3 (da
 * dong bang) dat khoa chinh o `id` va rang buoc DUY NHAT o `session_token`.
 * Ten cot, kieu cot, tinh not-null deu khop; ma chay cua adapter chi dung
 * `eq(sessionsTable.sessionToken, ...)` nen no khong quan tam do la khoa chinh
 * hay khoa duy nhat — hai cach deu tra ve toi da mot dong. Chi ep kieu rieng
 * bang nay, khong ep ca cum, de con phat hien lech that o ba bang kia.
 */
const bangPhien = sessions as unknown as LuocDoAuth['sessionsTable'];

/** 30 ngay — bang mac dinh cua Auth.js, ghi ra day de doi cho nay khong phai doan. */
const HAN_PHIEN_GIAY = 30 * 24 * 60 * 60;

/**
 * Tim khong gian lam viec cua nguoi dung, tao neu chua co.
 *
 * Chay trong mot giao tac va khoa dong `users` truoc khi kiem tra: mo hai tab
 * roi dang nhap cung luc thi hai lan kiem tra deu thay "chua co" va tao ra hai
 * khong gian lam viec cho mot nguoi — hong am tham, vi tu do moi truy van sau
 * chi thay mot nua du lieu.
 */
async function baoDamCoKhongGianLamViec(
  userId: string,
  ten: string | null | undefined,
  email: string | null | undefined,
): Promise<string> {
  return db.transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update');

    const daCo = await tx
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);
    if (daCo.length > 0) return daCo[0].workspaceId;

    const tenChu = ten?.trim() || email?.split('@')[0] || 'toi';
    const [moi] = await tx
      .insert(workspaces)
      .values({ ten: `Khong gian cua ${tenChu}`, chuSoHuuId: userId })
      .returning({ id: workspaces.id });

    await tx
      .insert(workspaceMembers)
      .values({ workspaceId: moi.id, userId, vaiTro: 'chu_so_huu' });

    return moi.id;
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: oauthAccounts,
    sessionsTable: bangPhien,
    verificationTokensTable: verificationTokens,
  }),

  // Dat tuong minh du adapter da keo mac dinh ve 'database': roi ve JWT la phien
  // KHONG THU HOI DUOC — khoa tai khoan xong nguoi do van dung tiep toi khi het han.
  session: { strategy: 'database', maxAge: HAN_PHIEN_GIAY },

  // Chay sau Nginx. Khong bat thi Auth.js dung sai URL goi nguoc, dang nhap loi.
  trustHost: true,

  providers: [
    Google({
      // CHI xin openid/email/profile. Xin them Drive/Sheets "de danh" keo theo
      // quy trinh xac minh nang cua Google cho mot thu chua dung den.
      authorization: { params: { scope: 'openid email profile' } },
    }),
  ],

  pages: {
    signIn: '/dang-nhap',
    // Tra loi ve chinh trang dang nhap kem ?error=... thay vi trang loi mac dinh
    // cua Auth.js — nguoi bi tu choi can thay thong bao tieng Viet.
    error: '/dang-nhap',
  },

  callbacks: {
    /**
     * Chan o day chu khong o cho khac: callback nay chay TRUOC khi Auth.js ghi
     * `users`/`oauth_accounts`, nen email ngoai danh sach khong de lai dong nao.
     */
    signIn({ user }) {
      if (emailDuocPhep(user.email, process.env.AUTH_ALLOWED_EMAILS)) return true;
      console.warn(`[auth] tu choi dang nhap ngoai danh sach cho phep: ${user.email}`);
      return false;
    },

    /**
     * Chi tra ve dung nhung truong can dung. KHONG duoc tra `{ ...session }`:
     * `session` o day la nguyen dong bang `sessions`, ke ca `session_token` —
     * do la gia tri cua cookie httpOnly, dua no ra `/api/auth/session` cho
     * JavaScript doc duoc thi httpOnly con lai vo nghia.
     */
    async session({ session, user }) {
      const thuoc = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, user.id))
        .limit(1);

      return {
        user: { id: user.id, name: user.name, email: user.email, image: user.image },
        expires: session.expires.toISOString(),
        workspaceId: thuoc[0]?.workspaceId ?? null,
      };
    },
  },

  events: {
    /**
     * Tao khong gian lam viec o day chu khong o callback `signIn`: luc callback
     * `signIn` chay, nguoi dung moi chua co dong nao trong `users` nen chua co
     * id de gan `chu_so_huu_id`. Event nay chay sau khi Auth.js da ghi
     * users + oauth_accounts + sessions.
     */
    async signIn({ user }) {
      if (!user.id) return;
      await baoDamCoKhongGianLamViec(user.id, user.name, user.email);
      await db
        .update(users)
        .set({ lanDangNhapCuoi: new Date() })
        .where(eq(users.id, user.id));
    },
  },
});
