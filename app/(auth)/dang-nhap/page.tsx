import type { Metadata } from 'next';

import { signIn } from '@/auth';

import './dang-nhap-page.css';

export const metadata: Metadata = { title: 'Đăng nhập — AI Content' };

/**
 * Auth.js chuyển về đây kèm `?error=...` khi đăng nhập hỏng. Chỉ diễn giải mã
 * lỗi, không in nguyên văn ra trang: mã lỗi của Auth.js là tiếng Anh và đôi khi
 * lộ chi tiết cấu hình máy chủ.
 */
function dienGiaiLoi(ma: string | undefined): string | null {
  if (!ma) return null;
  if (ma === 'AccessDenied') {
    return 'Tài khoản Google này chưa được cấp quyền vào hệ thống. Liên hệ quản trị để được thêm vào danh sách.';
  }
  if (ma === 'Configuration') {
    return 'Máy chủ chưa cấu hình xong phần đăng nhập Google. Báo quản trị viên.';
  }
  return 'Đăng nhập không thành công. Thử lại sau ít phút.';
}

export default async function TrangDangNhap({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const loi = dienGiaiLoi(error);

  return (
    <main className="dn-canvas">
      <div className="dn-the">
        <h1 className="dn-nhan">AI Content</h1>
        <p className="dn-phu">Đăng nhập bằng tài khoản Google của bạn để vào không gian làm việc.</p>

        {loi ? (
          <p className="dn-loi" role="alert">
            {loi}
          </p>
        ) : null}

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/templates' });
          }}
        >
          <button className="dn-nut" type="submit">
            <svg className="dn-logo" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l-.1.3 6.5 5 .5.1c4.1-3.8 6.6-9.5 6.6-15.7"
              />
              <path
                fill="#34A853"
                d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.3.1-6.7 5.2-.1.3C7.9 40.9 15.4 46 24 46"
              />
              <path
                fill="#FBBC05"
                d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4v-.3l-6.8-5.3-.2.1a22 22 0 0 0 0 19.8z"
              />
              <path
                fill="#EA4335"
                d="M24 10.1c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.9 29.9 2 24 2 15.4 2 7.9 7.1 4.5 14.1l7 5.5C13.3 14.3 18.2 10.1 24 10.1"
              />
            </svg>
            Đăng nhập bằng Google
          </button>
        </form>

        <p className="dn-chan">Chỉ tài khoản trong danh sách nội bộ mới vào được.</p>
      </div>
    </main>
  );
}
