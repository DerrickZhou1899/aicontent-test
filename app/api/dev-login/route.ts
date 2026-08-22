/**
 * Cua dang nhap danh RIENG cho bai test — khong co trong ban that.
 *
 * VI SAO CAN: ban that dang nhap bang Google. De chay duoc no ban phai tu tao
 * mot OAuth client tren Google Cloud, khai bao dung URL goi nguoc, roi moi vao
 * duoc man hinh dau tien. Do la mot gio dong ho khong do duoc ky nang lap trinh
 * nao ca, nen o day thay bang mot cua tat.
 *
 * VI SAO KHONG DUNG PROVIDER `Credentials` CUA AUTH.JS: Auth.js v5 ep phien
 * sang JWT khi co Credentials, ma du an nay co y dat `session.strategy` =
 * 'database' (phien phai THU HOI duoc — xem ghi chu trong `auth.ts`). Doi sang
 * JWT chi de dang nhap cho tien la doi mot tinh chat that cua he thong. Nen cua
 * nay ghi thang mot dong vao bang `sessions` giong het luc Google tra ve.
 *
 * HAI LOP KHOA, thieu mot lop la 404 chu khong phai loi — 404 khong lo ra rang
 * co duong nay ton tai:
 *   1. NODE_ENV !== 'production'
 *   2. AUTH_DEV_LOGIN=1
 */

import { randomBytes } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { db } from '@/db/client';
import { sessions, users, workspaceMembers, workspaces } from '@/db/schema/auth';

/**
 * PHAI trung email trong `db/seed.sql`.
 *
 * Lech mot ky tu la cua nay tao ra mot nguoi dung thu hai kem mot khong gian
 * lam viec rong — dang nhap vao thay man hinh trang, trong khi du lieu mau van
 * nam nguyen o khong gian kia. Hong kieu do rat mat thoi gian de nhin ra.
 */
const EMAIL_DEV = 'seed@aicontent.local';
const TEN_DEV = 'Nhan su noi dung';
const HAN_PHIEN_MS = 30 * 24 * 60 * 60 * 1000;

/** Ten cookie mac dinh cua Auth.js v5 khi chay http (khong phai https). */
const TEN_COOKIE = 'authjs.session-token';

function batDuoc(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.AUTH_DEV_LOGIN === '1';
}

/**
 * Tim hoac tao nguoi dung dev kem khong gian lam viec.
 *
 * Chay trong mot giao tac vi ly do giong het `baoDamCoKhongGianLamViec` trong
 * `auth.ts`: bam hai tab cung luc ma khong khoa thi tao ra hai khong gian cho
 * mot nguoi, va tu do moi truy van sau chi thay mot nua du lieu.
 */
async function baoDamNguoiDungDev(): Promise<string> {
  return db.transaction(async (tx) => {
    const daCo = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, EMAIL_DEV))
      .limit(1);

    const userId =
      daCo[0]?.id ??
      (
        await tx
          .insert(users)
          .values({ name: TEN_DEV, email: EMAIL_DEV })
          .returning({ id: users.id })
      )[0].id;

    const coCho = await tx
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    if (coCho.length === 0) {
      const [moi] = await tx
        .insert(workspaces)
        .values({ ten: 'Khong gian thu nghiem', chuSoHuuId: userId })
        .returning({ id: workspaces.id });
      await tx
        .insert(workspaceMembers)
        .values({ workspaceId: moi.id, userId, vaiTro: 'chu_so_huu' });
    }

    return userId;
  });
}

export async function GET() {
  if (!batDuoc()) return new NextResponse('Not found', { status: 404 });

  const userId = await baoDamNguoiDungDev();

  const token = randomBytes(32).toString('hex');
  await db.insert(sessions).values({
    sessionToken: token,
    userId,
    expires: new Date(Date.now() + HAN_PHIEN_MS),
  });

  const kho = await cookies();
  kho.set(TEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // Khong dat `secure`: cua nay chi chay tren http://localhost, bat secure vao
    // la trinh duyet bo cookie ma khong bao gi.
    expires: new Date(Date.now() + HAN_PHIEN_MS),
  });

  return NextResponse.redirect(new URL('/', process.env.AUTH_URL ?? 'http://localhost:6980'));
}
