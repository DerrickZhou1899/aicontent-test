const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const thuMuc = join(__dirname, '..', 'app', '(dash)', 'studio', 'de-xuat');

function doc(tenTep) {
  return readFileSync(join(thuMuc, tenTep), 'utf8');
}

test('trang đọc ý tưởng đã lưu qua repo của workspace trong phiên', () => {
  const maNguon = doc('page.tsx');

  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /createRepo\(/);
  assert.match(maNguon, /yTuong\.listChiTiet\(\)/);
  assert.doesNotMatch(maNguon, /searchParams.*workspace/i);
});

test('danh sách hiển thị lý do và đúng bài nguồn của ý tưởng', () => {
  const maNguon = doc('danh-sach-y-tuong.tsx');

  assert.match(maNguon, /lyDoDeXuat/);
  assert.match(maNguon, /tieuDeNguon/);
  assert.match(maNguon, /lienKetNguon/);
  assert.match(maNguon, /https\?:/);
  assert.match(maNguon, /rel="noreferrer"/);
});

test('sinh thành công làm mới danh sách đã lưu', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /revalidatePath\(['"]\/studio\/de-xuat['"]\)/);
});
