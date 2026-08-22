'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  MO_HINH_API,
  chonMoHinh,
  loaiViecCuaNhiemVu,
} = require('../lib/model-runner/chon-mo-hinh');
const { chayNhiemVu } = require('../lib/model-runner/index');
const { LOAI_VIEC_NHAN } = require('../workers/model/index');

test('sinh anh chi xep cho worker API rieng, worker van ban khong nhan', () => {
  assert.equal(chonMoHinh('sinh-anh'), MO_HINH_API);
  assert.equal(chonMoHinh('sinh-anh', 'api'), MO_HINH_API);
  assert.equal(loaiViecCuaNhiemVu('sinh-anh'), 'sinh-anh');
  assert.throws(() => chonMoHinh('sinh-anh', 'claude-cli'), /chi ho tro api/i);
  assert.throws(() => chonMoHinh('sinh-anh', 'codex-cli'), /chi ho tro api/i);
  assert.equal(LOAI_VIEC_NHAN.includes('sinh-anh'), false);
});

test('chayNhiemVu xep job sinh anh voi nhan api', async () => {
  const cauLenh   = [];
  const khachHang = {
    async query(sql, thamSo) {
      cauLenh.push({ sql, thamSo });
      if (sql.includes('INSERT INTO jobs')) return { rowCount: 1, rows: [{ id: 'job-anh' }] };
      return { rowCount: 1, rows: [{ trang_thai: 'cho', ket_qua: null, loi: null }] };
    },
  };

  const ketQua = await chayNhiemVu({
    nhiemVu          : 'sinh-anh',
    duLieuVao        : { contentId: 'content-a' },
    khongGianLamViec : 'workspace-a',
    cho               : false,
    khachHang,
  });
  const duLieuJob = JSON.parse(cauLenh[0].thamSo[2]);

  assert.equal(cauLenh[0].thamSo[1], 'sinh-anh');
  assert.deepEqual(duLieuJob, { contentId: 'content-a', nhiemVu: 'sinh-anh', moHinh: 'api' });
  assert.equal(ketQua.moHinh, 'api');
});
