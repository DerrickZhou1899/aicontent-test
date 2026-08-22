'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { donKetQuaKichBan } = require('../lib/studio/sinh-kich-ban.ts');

test('dọn tiêu đề và giữ các phân cảnh quay được', () => {
  const ketQua = donKetQuaKichBan({
    tieuDe  : ' Kịch bản một ngày bận rộn ',
    phanCanh: [
      { thoiLuongGiay: 3, hinhAnh: ' Cận cảnh danh sách việc ', loiThoai: ' Bạn cũng đang quá tải? ' },
      { thoiLuongGiay: 7.5, hinhAnh: ' Quay màn hình thao tác ', loiThoai: '' },
    ],
  });

  assert.deepEqual(ketQua, {
    tieuDe  : 'Kịch bản một ngày bận rộn',
    phanCanh: [
      { thoiLuongGiay: 3, hinhAnh: 'Cận cảnh danh sách việc', loiThoai: 'Bạn cũng đang quá tải?' },
      { thoiLuongGiay: 7.5, hinhAnh: 'Quay màn hình thao tác', loiThoai: '' },
    ],
  });
});

test('loại cảnh sai thời lượng hoặc thiếu mô tả hình ảnh', () => {
  const ketQua = donKetQuaKichBan({
    tieuDe  : 'Kịch bản hợp lệ',
    phanCanh: [
      { thoiLuongGiay: 0, hinhAnh: 'Cảnh một', loiThoai: 'Một' },
      { thoiLuongGiay: -2, hinhAnh: 'Cảnh hai', loiThoai: 'Hai' },
      { thoiLuongGiay: 4, hinhAnh: '   ', loiThoai: 'Ba' },
      { thoiLuongGiay: 5, hinhAnh: 'Cảnh cuối', loiThoai: 'Kết' },
    ],
  });

  assert.deepEqual(ketQua?.phanCanh, [
    { thoiLuongGiay: 5, hinhAnh: 'Cảnh cuối', loiThoai: 'Kết' },
  ]);
});

test('từ chối kết quả thiếu tiêu đề hoặc không còn phân cảnh hợp lệ', () => {
  assert.equal(donKetQuaKichBan({ tieuDe: '', phanCanh: [] }), null);
  assert.equal(donKetQuaKichBan({
    tieuDe: 'Có tiêu đề', phanCanh: [{ thoiLuongGiay: '5', hinhAnh: 'Cảnh', loiThoai: '' }],
  }), null);
});
