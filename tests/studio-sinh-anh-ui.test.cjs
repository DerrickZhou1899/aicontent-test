'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const thuMuc = join(__dirname, '..', 'app', '(dash)', 'studio', 'bien-soan');

function doc(tenTep) {
  return readFileSync(join(thuMuc, tenTep), 'utf8');
}

test('action sinh và đọc ảnh luôn lấy workspace từ phiên', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /export async function guiSinhAnh/);
  assert.match(maNguon, /export async function guiDocAnh/);
  assert.match(maNguon, /sinhAnh\(\{[\s\S]*workspaceId\s*:\s*await workspaceHienTai\(\)/);
  assert.match(maNguon, /docAnh\(\{[\s\S]*workspaceId\s*:\s*await workspaceHienTai\(\)/);
  assert.doesNotMatch(maNguon, /workspaceId\s*:\s*thamSo/);
});

test('ảnh chỉ xuất hiện sau khi bản nháp đã được lưu', () => {
  const maNguon = doc('man-hinh-bien-soan.tsx');

  assert.match(maNguon, /import \{ XemAnh \}/);
  assert.match(maNguon, /ketQuaLuu\?\.ok\s*\?\s*\(/);
  assert.match(maNguon, /<XemAnh contentId=\{ketQuaLuu\.duLieu\.contentId\}/);
});

test('khối sinh ảnh tự hỏi trạng thái và đọc ảnh qua tuyến media', () => {
  const maNguon = doc('xem-anh.tsx');

  assert.match(maNguon, /guiSinhAnh\(contentId\)/);
  assert.match(maNguon, /guiDocAnh\(jobId!?\)/);
  assert.match(maNguon, /setTimeout\(hoiTrangThai,\s*2000\)/);
  assert.match(maNguon, /\/api\/media\//);
  assert.match(maNguon, /encodeURIComponent/);
  assert.match(maNguon, /Tạo ảnh cho bài/);
  assert.match(maNguon, /role="alert"/);
});

test('trạng thái hàng đợi được đổi thành câu chữ dễ hiểu', () => {
  const maNguon = doc('xem-anh.tsx');

  assert.match(maNguon, /cho\s*:\s*'Chờ xử lý'/);
  assert.match(maNguon, /dang_chay\s*:\s*'Đang xử lý'/);
  assert.match(maNguon, /nhanTrangThai\(trangThai\)/);
});
