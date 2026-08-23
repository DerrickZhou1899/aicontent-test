'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { taoDichVuLuuHangLoat } = require('../lib/studio/luu-hang-loat.ts');

function taoNen(yTuongHong = null) {
  const trangThai = { baiDaTao: [], yTuongDaDung: new Set() };
  const repo      = {
    yTuong: {
      layChiTietTheoId: async (id) => id === yTuongHong ? null : {
        beMat       : 'fanpage',
        pillarId    : null,
        personaId   : null,
        productId   : null,
        gocTiepCan  : 'Góc viết',
        nguonYTuong : 'may-de-xuat',
      },
      nhanQuyenSuDung: async (id) => {
        if (trangThai.yTuongDaDung.has(id)) return null;
        trangThai.yTuongDaDung.add(id);
        return repo.yTuong.layChiTietTheoId(id);
      },
    },
    contents: {
      tao: async (giaTri) => {
        trangThai.baiDaTao.push(giaTri);
        return { id: `content-${trangThai.baiDaTao.length}` };
      },
    },
  };
  const phuThuoc = {
    trongGiaoDich: async (_workspaceId, viec) => {
      const mocBai    = trangThai.baiDaTao.length;
      const yTuongCu  = new Set(trangThai.yTuongDaDung);
      try {
        return await viec(repo);
      } catch (loi) {
        trangThai.baiDaTao.splice(mocBai);
        trangThai.yTuongDaDung = yTuongCu;
        throw loi;
      }
    },
  };
  return { phuThuoc, trangThai };
}

function taoBai(ideaId) {
  return {
    ideaId,
    banNhap: {
      tieuDe  : `Tiêu đề ${ideaId}`,
      noiDung : `Nội dung ${ideaId}`,
      hashtag : ['#banhang'],
    },
  };
}

test('lưu toàn bộ bản nháp trong một giao dịch', async () => {
  const { phuThuoc, trangThai } = taoNen();
  const ketQua = await taoDichVuLuuHangLoat(phuThuoc)({
    workspaceId : 'ws-a',
    nguoiTao    : 'user-a',
    bai         : [taoBai('idea-a'), taoBai('idea-b')],
  });

  assert.deepEqual(ketQua, {
    ok       : true,
    duLieu   : { soBai: 2, contentIds: ['content-1', 'content-2'] },
    canhBao  : [],
  });
  assert.equal(trangThai.baiDaTao.length, 2);
  assert.deepEqual([...trangThai.yTuongDaDung], ['idea-a', 'idea-b']);
  assert.equal(trangThai.baiDaTao[0].trangThai, 'ban_nhap');
});

test('một ý tưởng không hợp lệ thì không lưu dở cả lô', async () => {
  const { phuThuoc, trangThai } = taoNen('idea-b');
  const ketQua = await taoDichVuLuuHangLoat(phuThuoc)({
    workspaceId : 'ws-a',
    nguoiTao    : 'user-a',
    bai         : [taoBai('idea-a'), taoBai('idea-b')],
  });

  assert.equal(ketQua.ok, false);
  assert.deepEqual(trangThai.baiDaTao, []);
  assert.deepEqual([...trangThai.yTuongDaDung], []);
});

test('từ chối lô rỗng, quá 10 bài hoặc trùng ý tưởng', async () => {
  const { phuThuoc } = taoNen();
  const dichVu       = taoDichVuLuuHangLoat(phuThuoc);

  assert.equal((await dichVu({ workspaceId: 'ws-a', nguoiTao: 'u', bai: [] })).ok, false);
  assert.equal((await dichVu({ workspaceId: 'ws-a', nguoiTao: 'u', bai: Array.from({ length: 11 }, (_, i) => taoBai(`i-${i}`)) })).ok, false);
  assert.equal((await dichVu({ workspaceId: 'ws-a', nguoiTao: 'u', bai: [taoBai('i'), taoBai('i')] })).ok, false);
});
