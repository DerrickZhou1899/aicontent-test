'use strict';

const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const goc = join(__dirname, '..');

test('trang bài đã tạo chỉ đọc bản nháp trong workspace hiện tại', () => {
  const duongDan = join(goc, 'app', '(dash)', 'bai-da-tao', 'page.tsx');
  assert.equal(existsSync(duongDan), true, 'Thiếu trang bài đã tạo');
  const maNguon = readFileSync(duongDan, 'utf8');

  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /createRepo\(/);
  assert.match(maNguon, /contents\.listBanNhapChiTiet\(/);
  assert.match(maNguon, /Bản nháp đã lưu/);
  assert.match(maNguon, /muc\.tieuDeYTuong/);
  assert.match(maNguon, /muc\.noiDung/);
});

test('thanh điều hướng mở được kho bài đã tạo', () => {
  const duongDan = join(goc, 'app', '(dash)', 'app-shell.tsx');
  const maNguon  = readFileSync(duongDan, 'utf8');

  assert.match(maNguon, /href="\/bai-da-tao"/);
  assert.doesNotMatch(maNguon, /href="#"[^>]*>[^<]*<Icon name="i-folder"[^>]*\/>Bài đã tạo/);
});

test('mỗi bản nháp mở được trang chỉnh sửa và hiển thị trạng thái ảnh', () => {
  const duongDan = join(goc, 'app', '(dash)', 'bai-da-tao', 'page.tsx');
  const maNguon  = readFileSync(duongDan, 'utf8');

  assert.match(maNguon, /asset\.theoNoiDung/);
  assert.match(maNguon, /href=\{`\/bai-da-tao\/\$\{muc\.id\}`\}/);
  assert.match(maNguon, /Chỉnh sửa và tạo ảnh/);
  assert.match(maNguon, /Đã có ảnh/);
  assert.match(maNguon, /Chưa có ảnh/);
});

test('trang chi tiết chỉ đọc bản nháp trong workspace và cho phép chỉnh sửa', () => {
  const thuMuc   = join(goc, 'app', '(dash)', 'bai-da-tao', '[id]');
  const trang    = readFileSync(join(thuMuc, 'page.tsx'), 'utf8');
  const trinhSua = readFileSync(join(thuMuc, 'trinh-sua-ban-nhap.tsx'), 'utf8');
  const actions  = readFileSync(join(goc, 'app', '(dash)', 'bai-da-tao', 'actions.ts'), 'utf8');

  assert.match(trang, /workspaceHienTai\(\)/);
  assert.match(trang, /contents\.layBanNhapChiTietTheoId\(id\)/);
  assert.match(trang, /trangThai !== 'ban_nhap'/);
  assert.match(trang, /asset\.theoNoiDung\(\[id\]\)/);
  assert.match(trinhSua, /<textarea/);
  assert.match(trinhSua, /Tên ý tưởng/);
  assert.match(trinhSua, /banNhap\.tieuDeYTuong/);
  assert.match(trinhSua, /Lưu thay đổi/);
  assert.match(trinhSua, /<XemAnh contentId=\{banNhap\.id\}/);
  assert.match(actions, /workspaceHienTai\(\)/);
  assert.match(actions, /suaBanNhap/);
});
