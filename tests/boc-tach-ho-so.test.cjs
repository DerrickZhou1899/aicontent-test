/**
 * Don ket qua boc tach — lop chiu dung ket qua meo mo cua mo hinh.
 *
 * Khong goi mo hinh that o day. Thu can kiem la: mo hinh tra thieu truong, tra
 * `null` thay cho mang, tra dong khong co ten, tra kieu sai — man hinh xem
 * truoc van phai dung duoc. Vo o day nghia la nguoi dung dan mot trang van ban
 * roi nhan mot trang loi.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { bocTachHoSo, donBanNhap, TOI_DA_KY_TU } = require('../lib/brand/boc-tach.ts');

test('ket qua rong van ra ban nhap dung hinh dang', () => {
  for (const tho of [null, undefined, {}, { hoSo: null }]) {
    const bn = donBanNhap(tho);
    assert.deepEqual(bn.hoSo, { moTa: null, giongDieu: null, dieuCamKy: null });
    assert.deepEqual(bn.sanPham, []);
    assert.deepEqual(bn.chanDung, []);
    assert.deepEqual(bn.truCot, []);
  }
});

test('mo hinh tra null thay cho mang thi thanh mang rong, khong no', () => {
  const bn = donBanNhap({ hoSo: {}, sanPham: null, chanDung: 'khong phai mang', truCot: 7 });
  assert.deepEqual(bn.sanPham, []);
  assert.deepEqual(bn.chanDung, []);
  assert.deepEqual(bn.truCot, []);
});

test('dong khong co ten bi bo — ba bang deu bat cot ten', () => {
  const bn = donBanNhap({
    sanPham: [{ ten: '  ', loiIch: 'co' }, { ten: 'Goi tu van', loiIch: 'ro' }],
    chanDung: [{ noiDau: 'ban' }, { ten: 'Chu shop', noiDau: 'ban' }],
    truCot: [{ mucDich: 'khong ten' }, { ten: 'Nuoi duong', mucDich: 'long tin' }],
  });
  assert.equal(bn.sanPham.length, 1);
  assert.equal(bn.sanPham[0].ten, 'Goi tu van');
  assert.equal(bn.chanDung.length, 1);
  assert.equal(bn.truCot.length, 1);
});

test('chuoi rong va chuoi toan khoang trang deu thanh null', () => {
  const bn = donBanNhap({
    hoSo: { moTa: '   ', giongDieu: '', dieuCamKy: '  khong hua  ' },
    sanPham: [{ ten: 'A', gia: '   ', loiIch: null }],
  });
  assert.equal(bn.hoSo.moTa, null);
  assert.equal(bn.hoSo.giongDieu, null);
  assert.equal(bn.hoSo.dieuCamKy, 'khong hua', 'phai cat khoang trang hai dau');
  assert.equal(bn.sanPham[0].gia, null);
});

test('kieu sai o truong chuoi thanh null chu khong loi', () => {
  const bn = donBanNhap({
    hoSo: { moTa: 123, giongDieu: { a: 1 }, dieuCamKy: ['x'] },
    truCot: [{ ten: 'Tru cot', mucDich: 42 }],
  });
  assert.equal(bn.hoSo.moTa, null);
  assert.equal(bn.hoSo.giongDieu, null);
  assert.equal(bn.hoSo.dieuCamKy, null);
  assert.equal(bn.truCot[0].mucDich, null);
});

test('phan tu khong phai doi tuong trong mang bi loai', () => {
  const bn = donBanNhap({ sanPham: ['chuoi', null, 5, { ten: 'That' }] });
  assert.equal(bn.sanPham.length, 1);
  assert.equal(bn.sanPham[0].ten, 'That');
});

test('giu du cac cot cua tung nhom', () => {
  const bn = donBanNhap({
    chanDung: [
      {
        ten: 'Chu shop',
        doTuoi: '28-40',
        ngheNghiep: 'ban hang online',
        noiDau: 'khong co thoi gian',
        mongMuon: 'dang deu',
        cauNoiThuongDung: 'lam sao cho nhanh',
      },
    ],
  });
  assert.deepEqual(bn.chanDung[0], {
    ten: 'Chu shop',
    doTuoi: '28-40',
    ngheNghiep: 'ban hang online',
    noiDau: 'khong co thoi gian',
    mongMuon: 'dang deu',
    cauNoiThuongDung: 'lam sao cho nhanh',
  });
});

test('gioi han do dai van ban la con so duong', () => {
  assert.ok(TOI_DA_KY_TU > 0);
});

/**
 * Hai ca duoi day tra ve TRUOC khi goi mo hinh, nen kiem duoc ma khong can
 * worker chay. Chung la cua vao: van ban rong hay qua dai thi khong duoc phep
 * tieu mot luot goi mo hinh.
 */
test('van ban rong khong goi mo hinh', async () => {
  for (const tho of ['', '   ', '\n\t ']) {
    const kq = await bocTachHoSo('ws-bat-ky', tho);
    assert.equal(kq.ok, false);
    assert.equal(kq.jobId, null, 'khong duoc tao viec nao');
    assert.match(kq.loi, /Chưa có văn bản/);
  }
});

test('van ban qua dai bi chan truoc khi goi mo hinh', async () => {
  const kq = await bocTachHoSo('ws-bat-ky', 'a'.repeat(TOI_DA_KY_TU + 1));
  assert.equal(kq.ok, false);
  assert.equal(kq.jobId, null);
  assert.match(kq.loi, new RegExp(String(TOI_DA_KY_TU)));
});

/**
 * Codex soat doc lap tim ra: mo hinh tra dung dinh dang nhung rong ruot van qua
 * duoc vong kiem truong bat buoc, va nguoi dung nhan mot man hinh xem truoc
 * trong ma khong biet vi sao.
 */
test('ban nhap rong ruot bi nhan dien', () => {
  const { banNhapRong } = require('../lib/brand/boc-tach.ts');

  assert.equal(banNhapRong(donBanNhap({})), true);
  assert.equal(banNhapRong(donBanNhap({ hoSo: {}, sanPham: [], chanDung: [], truCot: [] })), true);
  assert.equal(
    banNhapRong(donBanNhap({ hoSo: { moTa: '   ' }, sanPham: [{ ten: '  ' }] })),
    true,
    'chuoi trang va dong khong ten khong tinh la co',
  );

  assert.equal(banNhapRong(donBanNhap({ hoSo: { moTa: 'co that' } })), false);
  assert.equal(banNhapRong(donBanNhap({ truCot: [{ ten: 'Nuoi duong' }] })), false);
});
