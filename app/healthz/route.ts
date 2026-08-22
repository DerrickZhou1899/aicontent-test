import { NextResponse } from 'next/server';

// pm2, cron auto-deploy và uptime check đều gọi endpoint này.
// Không trả thông tin cấu hình/biến môi trường: nó mở công khai qua Nginx.
export function GET() {
  return NextResponse.json(
    { ok: true, uptime: process.uptime() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
