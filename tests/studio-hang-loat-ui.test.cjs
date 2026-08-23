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
  assert.match(maNguon, /`Tạo \$\{daChon\.length\} bài`/);
  assert.match(maNguon, /Đang tạo bài…/);
  assert.doesNotMatch(maNguon, /`Sinh \$\{daChon\.length\} bài`/);
});

test('ô chọn ý tưởng đủ lớn để nhìn và bấm rõ ràng', () => {
  const duongDan = join(thuMuc, '..', 'studio.css');
  const css      = readFileSync(duongDan, 'utf8');

  assert.match(css, /\.muc--chon input\s*\{[^}]*width:\s*22px/s);
  assert.match(css, /\.muc--chon input\s*\{[^}]*height:\s*22px/s);
  assert.match(css, /\.muc--chon input\s*\{[^}]*flex:\s*0 0 22px/s);
});

test('màn hình hỏi tiến độ đến khi cả lô kết thúc và hiển thị bài hoàn tất', () => {
  const maNguon = doc('man-hinh-hang-loat.tsx');

  assert.match(maNguon, /useEffectEvent/);
  assert.match(maNguon, /guiDocTrangThaiLo/);
  assert.match(maNguon, /setTimeout\(capNhat, 2_000\)/);
  assert.match(maNguon, /clearTimeout\(henGio\)/);
  assert.match(maNguon, /useRef\(0\)/);
  assert.match(maNguon, /maLoHienTai\.current \+= 1/);
  assert.match(maNguon, /maLo !== maLoHienTai\.current/);
  assert.match(maNguon, /\['xong', 'loi', 'huy'\]/);
  assert.match(maNguon, /muc\.banNhap\.tieuDe/);
  assert.match(maNguon, /muc\.banNhap\.noiDung/);
  assert.match(maNguon, /muc\.banNhap\.hashtag/);
});

test('màn hình đổi mã trạng thái thành câu dễ hiểu', () => {
  const maNguon = doc('man-hinh-hang-loat.tsx');

  assert.match(maNguon, /cho\s*:\s*'Chờ xử lý'/);
  assert.match(maNguon, /dang_chay\s*:\s*'Đang tạo bài'/);
  assert.match(maNguon, /xong\s*:\s*'Đã tạo xong'/);
  assert.match(maNguon, /tenTrangThai\(muc\.trangThai\)/);
  assert.doesNotMatch(maNguon, /`Trạng thái: \$\{muc\.trangThai\}`/);
});

test('màn hình cho lưu các bản nháp đã tạo cùng lúc', () => {
  const maNguon = doc('man-hinh-hang-loat.tsx');
  const nutLuu  = doc('nut-luu-hang-loat.tsx');

  assert.match(maNguon, /<NutLuuHangLoat bai=\{baiCanLuu\}/);
  assert.match(maNguon, /muc\.banNhap/);
  assert.match(nutLuu, /`Lưu \$\{bai\.length\} bản nháp`/);
  assert.match(nutLuu, /guiLuuHangLoat\(bai\)/);
  assert.match(nutLuu, /Đã lưu \{ketQua\.duLieu\.soBai\} bản nháp/);
  assert.match(nutLuu, /href="\/bai-da-tao"/);
  assert.match(nutLuu, /Xem bản nháp đã lưu/);
});

test('mỗi kết quả phân biệt ý tưởng gốc và bài đăng đã tạo', () => {
  const maNguon = doc('man-hinh-hang-loat.tsx');

  assert.match(maNguon, />Ý tưởng gốc</);
  assert.match(maNguon, />Bài đăng đã tạo</);
});
