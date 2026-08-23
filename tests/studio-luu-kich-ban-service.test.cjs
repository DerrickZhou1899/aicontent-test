'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { taoDichVuLuuKichBan } = require('../lib/studio/luu-kich-ban.ts');

function taoNen(khongCoYTuong = false) {
  const trangThai = { workspaceId: null, baiDaTao: [] };
  const yTuong = khongCoYTuong ? null : {
    beMat       : 'fanpage',
    pillarId    : 'pillar-a',
    personaId   : 'persona-a',
    productId   : 'product-a',
    gocTiepCan  : 'Xuất hiện trong ba giây đầu',
    nguonYTuong : 'may-de-xuat',
  };
  const phuThuoc = {
    createRepo: (workspaceId) => ({
      yTuong: {
        layChiTietTheoId: async () => {
          trangThai.workspaceId = workspaceId;
          return yTuong;
        },
      },
      contents: {
        tao: async (giaTri) => {
          trangThai.baiDaTao.push(giaTri);
          return { id: 'kich-ban-a' };
        },
      },
    }),
  };
  return { phuThuoc, trangThai };
}

test('lưu kịch bản đã sửa thành bản nháp video trong workspace', async () => {
  const { phuThuoc, trangThai } = taoNen();
  const ketQua = await taoDichVuLuuKichBan(phuThuoc)({
    workspaceId : 'ws-a',
    ideaId      : 'idea-a',
    nguoiTao    : 'user-a',
    kichBan     : {
      tieuDe   : ' Video ba giây đầu ',
      phanCanh : [
        { thoiLuongGiay: 5, hinhAnh: ' Cận cảnh sản phẩm ', loiThoai: ' Mở đầu đã sửa. ' },
        { thoiLuongGiay: 7, hinhAnh: ' Chủ shop cầm sản phẩm ', loiThoai: '' },
      ],
    },
  });

  assert.deepEqual(ketQua, { ok: true, duLieu: { contentId: 'kich-ban-a' }, canhBao: [] });
  assert.equal(trangThai.workspaceId, 'ws-a');
  assert.deepEqual(trangThai.baiDaTao, [{
    ideaId      : 'idea-a',
    beMat       : 'fanpage',
    pillarId    : 'pillar-a',
    personaId   : 'persona-a',
    productId   : 'product-a',
    gocTiepCan  : 'Xuất hiện trong ba giây đầu',
    nguonYTuong : 'may-de-xuat',
    cauMoDau    : 'Mở đầu đã sửa.',
    dangBai     : 'kich_ban_quay',
    noiDung     : [
      'Video ba giây đầu',
      '',
      'Cảnh 1 · 5 giây',
      'Khung hình: Cận cảnh sản phẩm',
      'Lời thoại: Mở đầu đã sửa.',
      '',
      'Cảnh 2 · 7 giây',
      'Khung hình: Chủ shop cầm sản phẩm',
      'Lời thoại: Không có lời thoại.',
    ].join('\n'),
    trangThai : 'ban_nhap',
    nguoiTao  : 'user-a',
  }]);
});

test('không lưu kịch bản thiếu dữ liệu bắt buộc', async () => {
  const { phuThuoc, trangThai } = taoNen();
  const ketQua = await taoDichVuLuuKichBan(phuThuoc)({
    workspaceId : 'ws-a',
    ideaId      : 'idea-a',
    nguoiTao    : 'user-a',
    kichBan     : {
      tieuDe   : 'Kịch bản lỗi',
      phanCanh : [{ thoiLuongGiay: 0, hinhAnh: '', loiThoai: '' }],
    },
  });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /thời lượng và khung hình/i);
  assert.deepEqual(trangThai.baiDaTao, []);
});

test('không lưu kịch bản khi ý tưởng không thuộc workspace', async () => {
  const { phuThuoc, trangThai } = taoNen(true);
  const ketQua = await taoDichVuLuuKichBan(phuThuoc)({
    workspaceId : 'ws-a',
    ideaId      : 'idea-khac',
    nguoiTao    : 'user-a',
    kichBan     : {
      tieuDe   : 'Kịch bản',
      phanCanh : [{ thoiLuongGiay: 5, hinhAnh: 'Sản phẩm', loiThoai: '' }],
    },
  });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không tìm thấy/i);
  assert.deepEqual(trangThai.baiDaTao, []);
});
