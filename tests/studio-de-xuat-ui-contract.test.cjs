const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const thuMuc = join(__dirname, '..', 'app', '(dash)', 'studio', 'de-xuat');

function doc(tenTep) {
  return readFileSync(join(thuMuc, tenTep), 'utf8');
}

test('server action lấy workspace và người dùng từ phiên đăng nhập', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /nguoiDungHienTai\(\)/);
  assert.match(maNguon, /deXuatYTuong\(/);
  assert.doesNotMatch(maNguon, /form\.get\(['"]workspaceId['"]\)/);
});

test('màn đề xuất gửi bề mặt và số lượng rồi hiển thị kết quả cần duyệt', () => {
  const maNguon = doc('man-hinh-de-xuat.tsx');

  assert.match(maNguon, /name="beMat"/);
  assert.match(maNguon, /name="soLuong"/);
  assert.match(maNguon, /tieuDe/);
  assert.match(maNguon, /lyDoDeXuat/);
  assert.match(maNguon, /khamPha/);
});

test('route đề xuất có metadata và tải style riêng của màn hình', () => {
  const maNguon = doc('page.tsx');

  assert.match(maNguon, /export const metadata/);
  assert.match(maNguon, /ManHinhDeXuat/);
  assert.match(maNguon, /\.\/de-xuat\.css/);
});
