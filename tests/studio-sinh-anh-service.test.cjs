'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

let taoDichVuDocAnh;
let taoDichVuSinhAnh;
try {
  ({ taoDichVuDocAnh, taoDichVuSinhAnh } = require('../lib/studio/sinh-anh.ts'));
} catch {
  taoDichVuDocAnh = null;
  taoDichVuSinhAnh = null;
}

function taoNen(tuyChon = {}) {
  const loiGoiMay = [];
  const content = tuyChon.khongCoBai ? null : {
    id: 'content-a', noiDung: 'Một bài đã duyệt', trangThai: 'ban_nhap',
  };
  const job = tuyChon.khongCoJob ? null : {
    id         : 'job-a',
    trangThai : tuyChon.trangThai ?? 'xong',
    ketQua    : tuyChon.ketQua ?? {
      assetId: 'asset-a', duongDan: 'ws-a/anh-a.png', tiLe: '1:1',
    },
    loi       : tuyChon.loi ?? null,
  };
  const repo = {
    contents : { layTheoId: async () => content },
    jobs     : { layTheoId: async () => job },
  };
  return {
    loiGoiMay,
    phuThuoc: {
      createRepo  : () => repo,
      chayNhiemVu : async (thamSo) => {
        loiGoiMay.push(thamSo);
        return { jobId: 'job-a', trangThai: 'cho' };
      },
    },
  };
}

test('xếp job sinh ảnh không chờ cho bài thuộc workspace', async () => {
  const { phuThuoc, loiGoiMay } = taoNen();
  assert.equal(typeof taoDichVuSinhAnh, 'function');

  const ketQua = await taoDichVuSinhAnh(phuThuoc)({
    workspaceId : 'ws-a',
    contentId   : ' content-a ',
  });

  assert.deepEqual(ketQua, {
    ok: true, duLieu: { jobId: 'job-a', trangThai: 'cho' }, canhBao: [],
  });
  assert.deepEqual(loiGoiMay, [{
    nhiemVu          : 'sinh-anh',
    duLieuVao        : { contentId: 'content-a', tiLe: '1:1' },
    moHinh           : 'api',
    khongGianLamViec : 'ws-a',
    cho               : false,
  }]);
});

test('không xếp job khi bài không thuộc workspace', async () => {
  const { phuThuoc, loiGoiMay } = taoNen({ khongCoBai: true });
  const ketQua = await taoDichVuSinhAnh(phuThuoc)({
    workspaceId: 'ws-a', contentId: 'content-khac',
  });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không tìm thấy/i);
  assert.equal(loiGoiMay.length, 0);
});

test('đọc ảnh hoàn tất qua job thuộc workspace', async () => {
  const { phuThuoc } = taoNen();
  assert.equal(typeof taoDichVuDocAnh, 'function');

  const ketQua = await taoDichVuDocAnh(phuThuoc)({
    workspaceId: 'ws-a', jobId: 'job-a',
  });

  assert.deepEqual(ketQua, {
    ok: true,
    duLieu: {
      trangThai: 'xong',
      anh: { assetId: 'asset-a', duongDan: 'ws-a/anh-a.png', tiLe: '1:1' },
      loi: null,
    },
    canhBao: [],
  });
});

test('không đọc được job của workspace khác hoặc kết quả ảnh sai định dạng', async () => {
  const khacWorkspace = taoNen({ khongCoJob: true });
  const saiKetQua = taoNen({ ketQua: { duongDan: '../.env' } });

  const [ketQuaKhac, ketQuaSai] = await Promise.all([
    taoDichVuDocAnh(khacWorkspace.phuThuoc)({ workspaceId: 'ws-a', jobId: 'job-khac' }),
    taoDichVuDocAnh(saiKetQua.phuThuoc)({ workspaceId: 'ws-a', jobId: 'job-a' }),
  ]);

  assert.equal(ketQuaKhac.ok, false);
  assert.match(ketQuaKhac.loi, /không tìm thấy/i);
  assert.equal(ketQuaSai.ok, false);
  assert.match(ketQuaSai.loi, /không hợp lệ/i);
});
