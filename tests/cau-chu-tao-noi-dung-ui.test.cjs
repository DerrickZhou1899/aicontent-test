const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const goc = join(__dirname, '..');

function doc(duongDan) {
  return readFileSync(join(goc, duongDan), 'utf8');
}

test('menu và tiêu đề trang dùng từ tạo hàng loạt', () => {
  const menu = doc('app/(dash)/app-shell.tsx');
  const trang = doc('app/(dash)/studio/hang-loat/page.tsx');

  assert.match(menu, />Tạo hàng loạt</);
  assert.match(trang, /Tạo hàng loạt — AI Content/);
  assert.match(trang, /<h1 className="page-title">Tạo hàng loạt<\/h1>/);
  assert.doesNotMatch(`${menu}\n${trang}`, />Sinh hàng loạt|Sinh hàng loạt —/);
});

test('các nút và thông báo Studio dùng từ tạo dễ hiểu', () => {
  const bienSoan = doc('app/(dash)/studio/bien-soan/man-hinh-bien-soan.tsx');
  const actions  = doc('app/(dash)/studio/bien-soan/actions.ts');
  const anh      = doc('app/(dash)/studio/bien-soan/xem-anh.tsx');

  assert.match(bienSoan, /Tạo bản nháp/);
  assert.match(actions, /để tạo kịch bản/);
  assert.match(actions, /Việc tạo ảnh không hợp lệ/);
  assert.match(anh, /Ảnh minh họa đã tạo cho bài đăng/);
});

test('thông báo lỗi nghiệp vụ trả về giao diện dùng từ tạo', () => {
  const maNguon = [
    'lib/studio/sinh-bai.ts',
    'lib/studio/sinh-kich-ban.ts',
    'lib/studio/sinh-hang-loat.ts',
    'lib/studio/trang-thai-hang-loat.ts',
    'lib/studio/sinh-anh.ts',
  ].map(doc).join('\n');

  assert.doesNotMatch(maNguon, /'[^']*(?:sinh bài|sinh kịch bản|sinh hàng loạt|sinh ảnh)[^']*'/i);
});
