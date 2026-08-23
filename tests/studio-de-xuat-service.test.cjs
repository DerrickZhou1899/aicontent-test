'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { taoDichVuDeXuat } = require('../lib/studio/de-xuat.ts');

const thamSo    = { workspaceId: 'workspace-a', beMat: 'fanpage', soLuong: 3 };
const nguoiDung = { userId: 'user-a' };

function taoNen(tuyChon = {}) {
  const trangThai = {
    soChayMay       : 0,
    soTheoNguoiDung : 0,
    daNhanLuu       : false,
    thatBaiKhiLuu   : tuyChon.thatBaiKhiLuu === true,
    yTuongDaLuu     : [],
    lanDanhDauNguon : [],
  };
  const congThuc     = { kieuHook: 'hoi', chuDe: ['gia von'], soChu: 20, coCTA: false };
  const ketQuaYTuong = tuyChon.ketQuaYTuong ?? {
    yTuong : [
      { tieuDe: 'Kham pha', truCot: 'Giao duc', chanDung: 'Chu shop' },
      { tieuDe: 'Nguon mot', truCot: 'Giao duc', chanDung: 'Chu shop' },
      { tieuDe: 'Nguon hai', truCot: 'Giao duc', chanDung: 'Chu shop' },
    ],
  };
  const repo = {
    hoSo           : { lay: async () => ({ giongDieu: 'gan gui', dieuCamKy: 'khong hua qua' }) },
    truCot         : { list: async () => [{ id: 'tru-cot-a', ten: 'Giao duc', tiLeMucTieu: '1' }] },
    chanDung       : { list: async () => [{ id: 'chan-dung-a', ten: 'Chu shop', noiDau: 'thieu thoi gian' }] },
    insight        : { list: async () => [{ noiDung: 'can de hieu' }] },
    contents       : { list: async () => [{ gocTiepCan: 'gia von', cauMoDau: 'ban da tinh chua?' }] },
    tinHieuXuHuong : {
      theoNguoiDung : async () => {
        trangThai.soTheoNguoiDung += 1;
        return [
          { id: 'trend-1', congThuc },
          { id: 'trend-2', congThuc },
        ];
      },
      danhDauDaDung : async (ids) => {
        trangThai.lanDanhDauNguon.push([...ids]);
      },
    },
    jobs : {
      nhanQuyenLuuYTuong : async () => {
        if (trangThai.daNhanLuu) return false;
        trangThai.daNhanLuu = true;
        return true;
      },
    },
    yTuong : {
      tao : async (muc) => {
        if (trangThai.thatBaiKhiLuu) throw new Error('insert failed');
        trangThai.yTuongDaLuu.push(muc);
      },
    },
  };

  const phuThuoc = {
    createRepo    : () => repo,
    trongGiaoDich : async (_workspaceId, viec) => {
      const daNhanTruoc    = trangThai.daNhanLuu;
      const soYTuongTruoc  = trangThai.yTuongDaLuu.length;
      const soDanhDauTruoc = trangThai.lanDanhDauNguon.length;
      try {
        return await viec(repo);
      } catch (loi) {
        trangThai.daNhanLuu = daNhanTruoc;
        trangThai.yTuongDaLuu.splice(soYTuongTruoc);
        trangThai.lanDanhDauNguon.splice(soDanhDauTruoc);
        throw loi;
      }
    },
    chayNhiemVu : async () => {
      trangThai.soChayMay += 1;
      return tuyChon.ketQuaMay ?? {
        jobId : 'job-da-xong', trangThai: 'xong', moi: true, moHinh: 'auto', ketQua: ketQuaYTuong, loi: null,
      };
    },
    daBocXong : (giaTri) => Boolean(giaTri && typeof giaTri === 'object' && 'kieuHook' in giaTri),
  };
  return { phuThuoc, trangThai };
}

test('service skips followed-trend lookup without branded user and invokes one model job', async () => {
  assert.equal(typeof taoDichVuDeXuat, 'function');
  const { phuThuoc, trangThai } = taoNen();
  const dichVu = taoDichVuDeXuat(phuThuoc);

  const ketQua = await dichVu(thamSo);

  assert.equal(ketQua.ok, true);
  assert.equal(ketQua.duLieu.length, 3);
  assert.equal(trangThai.soTheoNguoiDung, 0);
  assert.equal(trangThai.soChayMay, 1);
  assert.equal(trangThai.yTuongDaLuu.length, 3);
});

test('service reads followed trends only with branded context and keeps source at its raw slot index', async () => {
  assert.equal(typeof taoDichVuDeXuat, 'function');
  const { phuThuoc, trangThai } = taoNen({
    ketQuaYTuong : {
      yTuong : [
        { tieuDe: 'Kham pha', truCot: 'Giao duc', chanDung: 'Chu shop' },
        null,
        { tieuDe: 'Nguon hai', truCot: 'Giao duc', chanDung: 'Chu shop', trendSignalId: 'model-invented' },
      ],
    },
  });
  const dichVu = taoDichVuDeXuat(phuThuoc);

  const ketQua = await dichVu(thamSo, nguoiDung);

  assert.equal(ketQua.ok, true);
  assert.deepEqual(ketQua.duLieu.map((muc) => muc.tieuDe), ['Kham pha', 'Nguon hai']);
  assert.equal(trangThai.soTheoNguoiDung, 1);
  assert.deepEqual(trangThai.yTuongDaLuu.map((muc) => muc.trendSignalId), [null, 'trend-2']);
  assert.deepEqual(trangThai.lanDanhDauNguon, [['trend-2']]);
});

test('failed model job returns an error without claiming or writing ideas', async () => {
  assert.equal(typeof taoDichVuDeXuat, 'function');
  const { phuThuoc, trangThai } = taoNen({
    ketQuaMay : { jobId: 'job-loi', trangThai: 'loi', moi: true, moHinh: 'auto', ketQua: null, loi: 'model failed' },
  });

  const ketQua = await taoDichVuDeXuat(phuThuoc)(thamSo, nguoiDung);

  assert.equal(ketQua.ok, false);
  assert.equal(trangThai.daNhanLuu, false);
  assert.equal(trangThai.yTuongDaLuu.length, 0);
  assert.equal(trangThai.lanDanhDauNguon.length, 0);
});

test('two callers of one completed job receive ideas but persist and mark sources once', async () => {
  assert.equal(typeof taoDichVuDeXuat, 'function');
  const { phuThuoc, trangThai } = taoNen();
  const dichVu = taoDichVuDeXuat(phuThuoc);

  const [lanMot, lanHai] = await Promise.all([dichVu(thamSo, nguoiDung), dichVu(thamSo, nguoiDung)]);

  assert.equal(lanMot.ok, true);
  assert.equal(lanHai.ok, true);
  assert.deepEqual(lanMot.duLieu, lanHai.duLieu);
  assert.equal(trangThai.yTuongDaLuu.length, 3);
  assert.deepEqual(trangThai.lanDanhDauNguon, [['trend-1', 'trend-2']]);
});

test('failed insert rolls the claim back so a retry can persist the completed job', async () => {
  assert.equal(typeof taoDichVuDeXuat, 'function');
  const { phuThuoc, trangThai } = taoNen({ thatBaiKhiLuu: true });
  const dichVu = taoDichVuDeXuat(phuThuoc);

  const thatBai = await dichVu(thamSo, nguoiDung);
  trangThai.thatBaiKhiLuu = false;
  const thuLai = await dichVu(thamSo, nguoiDung);

  assert.equal(thatBai.ok, false);
  assert.equal(thuLai.ok, true);
  assert.equal(trangThai.daNhanLuu, true);
  assert.equal(trangThai.yTuongDaLuu.length, 3);
  assert.deepEqual(trangThai.lanDanhDauNguon, [['trend-1', 'trend-2']]);
});
