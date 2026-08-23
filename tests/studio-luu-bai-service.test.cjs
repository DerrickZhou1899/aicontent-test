'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { taoDichVuLuuBai } = require('../lib/studio/luu-bai.ts');

function taoNen(tuyChon = {}) {
  const trangThai = {
    workspaceId : null,
    baiDaTao    : [],
    yTuongDaSua : [],
    daDaNhan    : false,
  };
  const yTuong = tuyChon.khongCoYTuong ? null : {
    id          : 'idea-a',
    beMat       : 'fanpage',
    pillarId    : 'pillar-a',
    personaId   : 'persona-a',
    productId   : 'product-a',
    gocTiepCan  : 'Giảm áp lực viết bài',
    nguonYTuong : 'may-de-xuat',
    daDung      : tuyChon.daDung ?? false,
  };
  const repo = {
    yTuong: {
      layChiTietTheoId : async () => yTuong,
      nhanQuyenSuDung   : async (id, tieuDe) => {
        if (yTuong.daDung || trangThai.daDaNhan) return null;
        trangThai.daDaNhan = true;
        trangThai.yTuongDaSua.push({ id, giaTri: { tieuDe, daDung: true } });
        return yTuong;
      },
    },
    contents: {
      tao: async (giaTri) => {
        trangThai.baiDaTao.push(giaTri);
        if (tuyChon.loiKhiTaoBai) throw new Error('Không ghi được');
        return { id: 'content-a', ...giaTri };
      },
    },
  };
  const phuThuoc = {
    trongGiaoDich: async (workspaceId, viec) => {
      trangThai.workspaceId = workspaceId;
      const mocBai     = trangThai.baiDaTao.length;
      const mocYTuong  = trangThai.yTuongDaSua.length;
      const daDaNhanCu = trangThai.daDaNhan;
      try {
        return await viec(repo);
      } catch (loi) {
        trangThai.baiDaTao.splice(mocBai);
        trangThai.yTuongDaSua.splice(mocYTuong);
        trangThai.daDaNhan = daDaNhanCu;
        throw loi;
      }
    },
  };
  return { phuThuoc, trangThai };
}

test('lưu bản đã sửa và đánh dấu ý tưởng đã dùng trong cùng giao dịch', async () => {
  const { phuThuoc, trangThai } = taoNen();
  const ketQua = await taoDichVuLuuBai(phuThuoc)({
    workspaceId : 'ws-a',
    ideaId      : 'idea-a',
    nguoiTao    : 'user-a',
    banNhap     : {
      tieuDe  : ' Tiêu đề người dùng đã sửa ',
      noiDung : ' Mở đầu đã sửa.\n\nNội dung chính. ',
      hashtag : [' #chu-shop ', 'noi dung', '#chu-shop'],
    },
  });

  assert.deepEqual(ketQua, { ok: true, duLieu: { contentId: 'content-a' }, canhBao: [] });
  assert.equal(trangThai.workspaceId, 'ws-a');
  assert.deepEqual(trangThai.baiDaTao, [{
    ideaId      : 'idea-a',
    beMat       : 'fanpage',
    pillarId    : 'pillar-a',
    personaId   : 'persona-a',
    productId   : 'product-a',
    gocTiepCan  : 'Giảm áp lực viết bài',
    nguonYTuong : 'may-de-xuat',
    cauMoDau    : 'Mở đầu đã sửa.',
    noiDung     : 'Mở đầu đã sửa.\n\nNội dung chính.\n\n#chu-shop #noidung',
    trangThai   : 'ban_nhap',
    nguoiTao    : 'user-a',
  }]);
  assert.deepEqual(trangThai.yTuongDaSua, [{
    id      : 'idea-a',
    giaTri : { tieuDe: 'Tiêu đề người dùng đã sửa', daDung: true },
  }]);
});

test('không ghi gì khi ý tưởng không thuộc workspace', async () => {
  const { phuThuoc, trangThai } = taoNen({ khongCoYTuong: true });
  const ketQua = await taoDichVuLuuBai(phuThuoc)({
    workspaceId : 'ws-a',
    ideaId      : 'idea-khac',
    nguoiTao    : 'user-a',
    banNhap     : { tieuDe: 'Tiêu đề', noiDung: 'Nội dung', hashtag: [] },
  });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không tìm thấy/i);
  assert.deepEqual(trangThai.baiDaTao, []);
  assert.deepEqual(trangThai.yTuongDaSua, []);
});

test('không tạo thêm bản nháp khi ý tưởng đã được dùng', async () => {
  const { phuThuoc, trangThai } = taoNen({ daDung: true });
  const ketQua = await taoDichVuLuuBai(phuThuoc)({
    workspaceId : 'ws-a',
    ideaId      : 'idea-a',
    nguoiTao    : 'user-a',
    banNhap     : { tieuDe: 'Tiêu đề', noiDung: 'Nội dung', hashtag: [] },
  });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /đã được lưu/i);
  assert.deepEqual(trangThai.baiDaTao, []);
  assert.deepEqual(trangThai.yTuongDaSua, []);
});

test('hai lần lưu đồng thời chỉ tạo một bản nháp', async () => {
  const { phuThuoc, trangThai } = taoNen();
  const thamSo = {
    workspaceId : 'ws-a',
    ideaId      : 'idea-a',
    nguoiTao    : 'user-a',
    banNhap     : { tieuDe: 'Tiêu đề', noiDung: 'Nội dung', hashtag: [] },
  };

  const ketQua = await Promise.all([
    taoDichVuLuuBai(phuThuoc)(thamSo),
    taoDichVuLuuBai(phuThuoc)(thamSo),
  ]);

  assert.equal(ketQua.filter((muc) => muc.ok).length, 1);
  assert.equal(trangThai.baiDaTao.length, 1);
});

test('không đánh dấu ý tưởng nếu lưu nội dung thất bại', async () => {
  const { phuThuoc, trangThai } = taoNen({ loiKhiTaoBai: true });
  const ketQua = await taoDichVuLuuBai(phuThuoc)({
    workspaceId : 'ws-a',
    ideaId      : 'idea-a',
    nguoiTao    : 'user-a',
    banNhap     : { tieuDe: 'Tiêu đề', noiDung: 'Nội dung', hashtag: [] },
  });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không thể lưu/i);
  assert.deepEqual(trangThai.yTuongDaSua, []);
});
