'use strict';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pm2 chạy `.next/standalone/server.js` chứ không dùng `next start`.
  // Thư mục standalone KHÔNG chứa `.next/static` và `public/` — script `build`
  // trong package.json phải tự copy vào, nếu không site mất sạch CSS.
  output: 'standalone',

  // Next 16 tự chèn khối hướng dẫn vào CLAUDE.md mỗi lần `next dev` chạy.
  // Tắt: file đó là quy ước của dự án, không để công cụ build sửa.
  agentRules: false,

  async redirects() {
    return [
      // Bản nội bộ chưa có landing page nên gốc domain trỏ thẳng vào dashboard.
      // Dùng `statusCode: 302` thay cho `permanent: false` (Next trả 307): giữ
      // đúng mã mà bản Express cũ trả về. Không dùng 301/308 vì browser cache
      // vĩnh viễn — sau này có landing page thật thì user cũ vẫn bị đá đi.
      { source: '/', destination: '/templates', statusCode: 302 },

      // Bản Express cũ phục vụ trang này ở `/app/templates`. Giữ đường cũ sống
      // để liên kết đã gửi cho nhân sự không chết. 302 chứ không 301 vì đây là
      // tương thích ngược tạm thời, không phải cấu trúc URL lâu dài.
      { source: '/app/templates', destination: '/templates', statusCode: 302 },
    ];
  },
};

module.exports = nextConfig;
