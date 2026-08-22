const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const thuMuc = join(__dirname, '..', 'app', '(dash)', 'studio', 'bien-soan');

function doc(tenTep) {
  return readFileSync(join(thuMuc, tenTep), 'utf8');
}

test('trang biên soạn đọc ý tưởng qua repo workspace trong phiên', () => {
  const maNguon = doc('page.tsx');

  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /createRepo\(/);
  assert.match(maNguon, /yTuong\.listChiTiet\(\)/);
});

test('server action chỉ nhận ideaId và gọi service sinh bài', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /form\.get\(['"]ideaId['"]\)/);
  assert.match(maNguon, /sinhBaiTuYTuong\(/);
  assert.doesNotMatch(maNguon, /form\.get\(['"]workspaceId['"]\)/);
});

test('server action lưu lấy người tạo và workspace từ phiên đăng nhập', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /nguoiDungHienTai\(\)/);
  assert.match(maNguon, /luuBanNhapBai\(/);
  assert.match(maNguon, /typeof thamSo\.ideaId/);
  assert.match(maNguon, /typeof thamSo\.noiDung/);
  assert.doesNotMatch(maNguon, /form\.get\(['"]userId['"]\)/);
  assert.doesNotMatch(maNguon, /form\.get\(['"]workspaceId['"]\)/);
});

test('bản nháp cho sửa đủ nội dung và nói rõ chưa lưu', () => {
  const maNguon = doc('man-hinh-bien-soan.tsx');

  assert.match(maNguon, /name="ideaId"/);
  assert.match(maNguon, /name="tieuDe"/);
  assert.match(maNguon, /name="noiDung"/);
  assert.match(maNguon, /name="hashtag"/);
  assert.match(maNguon, /chưa được lưu/i);
});

test('bản nháp gửi đúng nội dung đang sửa và báo kết quả lưu', () => {
  const maNguon = doc('man-hinh-bien-soan.tsx');

  assert.match(maNguon, /luuBanNhap/);
  assert.match(maNguon, /Lưu bản nháp/);
  assert.match(maNguon, /Đã lưu vào kho nội dung/);
  assert.match(maNguon, /ketQuaLuu\?\.ok \? 'Bản nháp đã lưu'/);
  assert.match(maNguon, /\|\| ketQuaLuu\?\.ok/);
});
