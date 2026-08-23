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

test('trang biên soạn chỉ chọn sẵn ideaId thuộc workspace hiện tại', () => {
  const trang   = doc('page.tsx');
  const manHinh = doc('man-hinh-bien-soan.tsx');

  assert.match(trang, /searchParams/);
  assert.match(trang, /yTuong\.some\(\(muc\) => muc\.id === ideaId\)/);
  assert.match(trang, /ideaIdMacDinh=\{ideaIdMacDinh\}/);
  assert.match(manHinh, /ideaIdMacDinh/);
  assert.match(manHinh, /defaultValue=\{ideaIdMacDinh/);
});

test('màn hình dùng câu chữ rõ ràng khi chọn và tạo bản nháp', () => {
  const maNguon = doc('man-hinh-bien-soan.tsx');

  assert.match(maNguon, /Bắt đầu từ ý tưởng đã duyệt/);
  assert.match(maNguon, /Đang tạo bản nháp…/);
});

test('server action chỉ nhận ideaId và gọi service sinh bài', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /form\.get\(['"]ideaId['"]\)/);
  assert.match(maNguon, /sinhBaiTuYTuong\(/);
  assert.doesNotMatch(maNguon, /form\.get\(['"]workspaceId['"]\)/);
});

test('server action sinh kịch bản lấy workspace từ phiên đăng nhập', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /export async function guiSinhKichBan/);
  assert.match(maNguon, /sinhKichBanTuYTuong\(/);
  assert.match(maNguon, /form\.get\(['"]ideaId['"]\)/);
  assert.match(maNguon, /form\.get\(['"]thoiLuongMucTieuGiay['"]\)/);
  assert.match(maNguon, /workspaceId\s*:\s*await workspaceHienTai\(\)/);
  assert.match(maNguon, /duLieu\s*:\s*\{\s*ideaId:\s*ideaId\.trim\(\),\s*kichBan:\s*ketQua\.duLieu\s*\}/);
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

test('màn hình sinh và hiển thị kịch bản theo từng phân cảnh', () => {
  const manHinh = doc('man-hinh-bien-soan.tsx');

  assert.match(manHinh, /import \{ XemKichBan \}/);
  assert.match(manHinh, /<XemKichBan ideaId=\{ideaId\}/);

  const kichBan = doc('xem-kich-ban.tsx');
  assert.match(kichBan, /useActionState\(guiSinhKichBan/);
  assert.match(kichBan, /name="ideaId"/);
  assert.match(kichBan, /name="thoiLuongMucTieuGiay"/);
  assert.match(kichBan, /value="30"/);
  assert.match(kichBan, /value="45"/);
  assert.match(kichBan, /value="60"/);
  assert.match(kichBan, /disabled=\{dangChay\}/);
  assert.match(kichBan, /role="alert">\{ketQua\.loi\}/);
  assert.match(kichBan, /kichBan\.tieuDe/);
  assert.match(kichBan, /phanCanh\.map\(/);
  assert.match(kichBan, /canh\.thoiLuongGiay/);
  assert.match(kichBan, /canh\.hinhAnh/);
  assert.match(kichBan, /canh\.loiThoai/);
  assert.match(kichBan, /Tạo kịch bản quay/);
});

test('kịch bản cho sửa từng cảnh trước khi lưu', () => {
  const kichBan = doc('xem-kich-ban.tsx');

  assert.match(kichBan, /name="tieuDeKichBan"/);
  assert.match(kichBan, /name="thoiLuongGiay"/);
  assert.match(kichBan, /name="hinhAnh"/);
  assert.match(kichBan, /name="loiThoai"/);
  assert.match(kichBan, /luuKichBan/);
  assert.match(kichBan, /Lưu kịch bản/);
  assert.match(kichBan, /Đã lưu vào kho nội dung/);
});

test('action lưu kịch bản lấy workspace và người tạo từ phiên', () => {
  const maNguon = doc('actions.ts');

  assert.match(maNguon, /export async function luuKichBan/);
  assert.match(maNguon, /luuBanNhapKichBan/);
  assert.match(maNguon, /workspaceHienTai\(\)/);
  assert.match(maNguon, /nguoiDungHienTai\(\)/);
  assert.doesNotMatch(maNguon, /thamSo\.workspaceId/);
  assert.doesNotMatch(maNguon, /thamSo\.nguoiTao/);
});
