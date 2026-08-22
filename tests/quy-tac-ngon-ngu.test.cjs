/**
 * Quy tac ngon ngu thuong hieu — content bible muc 9.2 va 9.3.
 *
 * Bai quan trong nhat o day la bai "khong dau": nhan su go tieng Viet khong dau
 * la chuyen thuong ngay. Ban dau tien cua bo quet nay bat duoc "thay the editor"
 * nhung SOT "tu dong 100%" va "dot pha" vi regex con doi ky tu `đ`. Bo test nay
 * khoa ca hai kieu viet lai.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  CUM_TU_BI_CAM,
  quetQuyTacNgonNgu,
} = require('../lib/brand/quy-tac-ngon-ngu.ts');

const cumTuCua = (vanBan) => quetQuyTacNgonNgu(vanBan).map((v) => v.cumTu);

test('bai sach khong bao vi pham nao', () => {
  const bai = 'AI hỗ trợ dựng, bạn duyệt bản cuối. Thời gian phụ thuộc video và cấu hình.';
  assert.deepEqual(quetQuyTacNgonNgu(bai), []);
});

test('van ban rong hoac thieu khong lam no', () => {
  for (const tho of ['', null, undefined]) {
    assert.deepEqual(quetQuyTacNgonNgu(tho), []);
  }
});

test('bat duoc cum tu VIET CO DAU', () => {
  const bai =
    'App này tự động 100%, ai cũng ra video trong 5 phút, không cần làm gì. ' +
    'Đây là bước đột phá, thay thế editor, cho video chuyên nghiệp ngay lập tức.';
  const bat = cumTuCua(bai);
  for (const mong of [
    'tự động 100%',
    'ai cũng ra video trong X phút',
    'không cần làm gì',
    'đột phá',
    'thay thế editor',
    'video chuyên nghiệp ngay lập tức',
  ]) {
    assert.ok(bat.includes(mong), `phai bat duoc "${mong}", nhan duoc ${JSON.stringify(bat)}`);
  }
});

test('bat duoc cum tu VIET KHONG DAU — ca hai kieu go deu phai bat', () => {
  const bai =
    'App nay tu dong 100%, ai cung ra video trong 5 phut, khong can lam gi. ' +
    'Day la buoc dot pha, thay the editor, cho video chuyen nghiep ngay lap tuc.';
  const bat = cumTuCua(bai);
  for (const mong of [
    'tự động 100%',
    'ai cũng ra video trong X phút',
    'không cần làm gì',
    'đột phá',
    'thay thế editor',
    'video chuyên nghiệp ngay lập tức',
  ]) {
    assert.ok(bat.includes(mong), `phai bat duoc "${mong}", nhan duoc ${JSON.stringify(bat)}`);
  }
});

test('chu hoa va khoang trang thua khong lot duoc', () => {
  assert.deepEqual(cumTuCua('TỰ  ĐỘNG   100 %'), ['tự động 100%']);
  assert.deepEqual(cumTuCua('Cách Mạng trong nganh'), ['cách mạng']);
});

test('vi tri tra ve tro dung ky tu trong van ban GOC', () => {
  const bai = 'Chúng tôi làm việc: tự động 100% luôn.';
  const [viPham] = quetQuyTacNgonNgu(bai);
  assert.ok(viPham, 'phai bat duoc');
  // Cat tu vi tri bao ve phai ra dung cum tu, khong lech mot ky tu nao.
  assert.equal(bai.slice(viPham.viTri, viPham.viTri + 'tự động 100%'.length), 'tự động 100%');
});

test('boi canh cat ra doc duoc va lay tu van ban goc co dau', () => {
  const bai = 'Trước đây khách hàng phải thuê editor. Nay app thay thế editor hoàn toàn.';
  const [viPham] = quetQuyTacNgonNgu(bai);
  assert.match(viPham.boiCanh, /thay thế editor/);
});

test('moi vi pham deu kem ban thay the cu the', () => {
  for (const viPham of quetQuyTacNgonNgu('tu dong 100% va dot pha')) {
    assert.ok(viPham.thayBang.length > 0, `"${viPham.cumTu}" thieu ban thay the`);
  }
});

test('nhieu lan xuat hien deu duoc bao, xep theo vi tri tang dan', () => {
  const bai = 'dot pha o day, roi lai dot pha o kia, va dot pha lan nua';
  const viPham = quetQuyTacNgonNgu(bai);
  assert.equal(viPham.length, 3);
  const viTri = viPham.map((v) => v.viTri);
  assert.deepEqual(viTri, [...viTri].sort((a, b) => a - b));
});

test('quet hai lan lien tiep cho ket qua giong nhau', () => {
  // Regex co co `g` mang trang thai `lastIndex`; quen dat lai la lan hai bo sot.
  const bai = 'tu dong 100% nhe';
  assert.deepEqual(quetQuyTacNgonNgu(bai), quetQuyTacNgonNgu(bai));
});

test('danh sach cho giao dien co du cum tu va ban thay the', () => {
  assert.ok(CUM_TU_BI_CAM.length >= 7);
  for (const muc of CUM_TU_BI_CAM) {
    assert.ok(muc.cumTu && muc.thayBang);
  }
});
