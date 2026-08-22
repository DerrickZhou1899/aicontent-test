import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Content',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Chạy trước khi trang vẽ lần đầu để không nháy sáng rồi mới sang tối.
// Đặt trên <html> vì token dark nằm ở :root[data-theme="dark"].
const THEME_INIT = `(function(){try{var t=localStorage.getItem('aicontent-theme');
if(t!=='dark'&&t!=='light')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: script trên đặt data-theme trước khi React hydrate,
    // React so sánh thuộc tính của <html> sẽ báo lệch nếu không tắt cảnh báo.
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
