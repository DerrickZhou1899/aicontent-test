import { AppShell } from './app-shell';
import { IconSprite } from './icon-sprite';

// Khung chung của mọi trang trong dashboard: sidebar + topbar + vùng nội dung.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IconSprite />
      <AppShell>{children}</AppShell>
    </>
  );
}
