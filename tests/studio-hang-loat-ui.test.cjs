const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const thuMuc = join(__dirname, '..', 'app', '(dash)', 'studio', 'hang-loat');

function doc(tenTep) {
  const duongDan = join(thuMuc, tenTep);
  assert.equal(existsSync(duongDan), true, `Thiếu tệp ${tenTep}`);
  return readFileSync(duongDan, 'utf8');
}

test('trang chỉ đưa ý tưởng chưa dùng của workspace hiện tại vào màn hình chọn', () => {
  const maNguon = doc('page.tsx');

  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /createRepo\(/);
  assert.match(maNguon, /yTuong\.listChiTiet\(\)/);
  assert.match(maNguon, /filter\(\(muc\) => !muc\.daDung\)/);
  assert.match(maNguon, /<ManHinhHangLoat/);
});

test('màn hình giới hạn 10 lựa chọn và hiển thị việc vừa xếp', () => {
  const maNguon = doc('man-hinh-hang-loat.tsx');

  assert.match(maNguon, /useActionState\(guiXepLo/);
  assert.match(maNguon, /SO_BAI_TOI_DA\s*=\s*10/);
  assert.match(maNguon, /name="ideaIds"/);
  assert.match(maNguon, /daChon\.length >= SO_BAI_TOI_DA/);
  assert.match(maNguon, /ketQua\.duLieu\.map\(/);
  assert.match(maNguon, /ketQua\?\.canhBao\.map\(/);
});
