'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

let taoDichVuSinhHangLoat;
try {
  ({ taoDichVuSinhHangLoat } = require('../lib/studio/sinh-hang-loat.ts'));
} catch {
  taoDichVuSinhHangLoat = null;
}

function taoNen(tuyChon = {}) {
  const loiXepTieuDe = tuyChon.loiXepTieuDe;
  const loiGoiMay    = [];
  const jobTheoKhoa  = new Map();
  const yTuong       = new Map([
    ['idea-a', {
      beMat: 'fanpage', tieuDe: 'Ý tưởng A', gocTiepCan: 'Góc A', cauMoDau: 'Mở A',
      lyDoDeXuat: 'Lý do A', pillarId: null, personaId: null, productId: null,
    }],
    ['idea-b', {
      beMat: 'fanpage', tieuDe: 'Ý tưởng B', gocTiepCan: 'Góc B', cauMoDau: 'Mở B',
      lyDoDeXuat: 'Lý do B', pillarId: null, personaId: null, productId: null,
    }],
  ]);
  if (tuyChon.cungPayload) yTuong.set('idea-b', { ...yTuong.get('idea-a') });
  const repo = {
    yTuong   : { layChiTietTheoId: async (id) => yTuong.get(id) ?? null },
    hoSo     : { lay: async () => ({ moTa: 'Shop nhỏ', giongDieu: 'Gần gũi', dieuCamKy: null }) },
    truCot   : { layTheoId: async () => null },
    chanDung : { layTheoId: async () => null },
    sanPham  : { layTheoId: async () => null },
    insight  : { list: async () => [{ noiDung: 'Muốn chuẩn bị đủ bài trong ngày' }] },
  };
  const phuThuoc = {
    createRepo  : () => repo,
    chayNhiemVu : async (thamSo) => {
      loiGoiMay.push(thamSo);
      const tieuDe = thamSo.duLieuVao.yTuong.tieuDe;
      if (tieuDe === loiXepTieuDe) throw new Error('queue unavailable');
      const khoa = thamSo.khoaChongTrung ?? JSON.stringify(thamSo.duLieuVao);
      if (!jobTheoKhoa.has(khoa)) jobTheoKhoa.set(khoa, `job-${jobTheoKhoa.size === 0 ? 'a' : 'b'}`);
      return {
        jobId: jobTheoKhoa.get(khoa),
        trangThai: 'cho', ketQua: null, loi: null,
      };
    },
  };
  return { phuThuoc, loiGoiMay };
}

function taoDichVu(phuThuoc) {
  assert.equal(typeof taoDichVuSinhHangLoat, 'function');
  return taoDichVuSinhHangLoat(phuThuoc);
}

test('service chặn lô rỗng, quá 10 ý tưởng hoặc trùng ID trước khi xếp job', async () => {
  for (const ideaIds of [[], Array.from({ length: 11 }, (_, i) => `idea-${i}`), ['idea-a', 'idea-a']]) {
    const { phuThuoc, loiGoiMay } = taoNen();
    const ketQua = await taoDichVu(phuThuoc)({ workspaceId: 'ws-a', ideaIds });

    assert.equal(ketQua.ok, false);
    assert.equal(loiGoiMay.length, 0);
  }
});

test('service xếp một job không chờ cho mỗi ý tưởng', async () => {
  const { phuThuoc, loiGoiMay } = taoNen();
  const ketQua = await taoDichVu(phuThuoc)({
    workspaceId: 'ws-a', ideaIds: ['idea-a', 'idea-b'],
  });

  assert.equal(ketQua.ok, true);
  assert.deepEqual(ketQua.duLieu, [
    { ideaId: 'idea-a', jobId: 'job-a', trangThai: 'cho' },
    { ideaId: 'idea-b', jobId: 'job-b', trangThai: 'cho' },
  ]);
  assert.equal(loiGoiMay.length, 2);
  for (const thamSo of loiGoiMay) {
    assert.equal(thamSo.nhiemVu, 'viet-bai');
    assert.equal(thamSo.khongGianLamViec, 'ws-a');
    assert.equal(thamSo.cho, false);
    assert.equal(JSON.stringify(thamSo.duLieuVao).includes('idea-'), false);
  }
});

test('service không xếp job nếu một ý tưởng không thuộc workspace', async () => {
  const { phuThuoc, loiGoiMay } = taoNen();
  const ketQua = await taoDichVu(phuThuoc)({
    workspaceId: 'ws-a', ideaIds: ['idea-a', 'idea-khac'],
  });

  assert.equal(ketQua.ok, false);
  assert.equal(loiGoiMay.length, 0);
});

test('service không gộp hai ý tưởng khác ID nhưng cùng payload', async () => {
  const { phuThuoc, loiGoiMay } = taoNen({ cungPayload: true });
  const ketQua = await taoDichVu(phuThuoc)({
    workspaceId: 'ws-a', ideaIds: ['idea-a', 'idea-b'],
  });

  assert.equal(ketQua.ok, true);
  assert.deepEqual(ketQua.duLieu.map((muc) => muc.jobId), ['job-a', 'job-b']);
  assert.equal(new Set(loiGoiMay.map((muc) => muc.khoaChongTrung)).size, 2);
  assert.equal(JSON.stringify(loiGoiMay.map((muc) => muc.duLieuVao)).includes('idea-'), false);
});

test('service giữ job đã xếp khi một job khác gửi thất bại', async () => {
  const { phuThuoc } = taoNen({ loiXepTieuDe: 'Ý tưởng B' });
  const ketQua = await taoDichVu(phuThuoc)({
    workspaceId: 'ws-a', ideaIds: ['idea-a', 'idea-b'],
  });

  assert.equal(ketQua.ok, true);
  assert.deepEqual(ketQua.duLieu, [{ ideaId: 'idea-a', jobId: 'job-a', trangThai: 'cho' }]);
  assert.equal(ketQua.canhBao.length, 1);
  assert.match(ketQua.canhBao[0], /idea-b/);
});
