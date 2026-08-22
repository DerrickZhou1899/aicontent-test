/**
 * Do day du ho so thuong hieu — ham thuan, khong cham database.
 *
 * Bo test nay soi TUNG dieu kien toi thieu chu khong chi soi con so cuoi: bang
 * trong so dung ma dieu kien "the nao la co" sai thi ho so rong van dat 100%,
 * va may de xuat chay tren ho so rong.
 *
 * Nap TypeScript qua moc `require` cua tsx, giong tests/data-access-behavior.test.cjs.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  NGUONG_CHAN_DE_XUAT,
  TRONG_SO,
  kiemTraDeXuat,
  nhomDaDat,
  tinhDoDayDu,
} = require('../lib/brand/do-day-du.ts');

const RONG = { truCot: [], chanDung: [], sanPham: [], insight: [], hoSo: null };

/** Ho so dat du ca nam nhom. */
function hoSoDayDu() {
  return {
    truCot: [
      { mucDich: 'nuoi duong long tin' },
      { mucDich: 'chung minh nang luc' },
      { mucDich: 'chao ban' },
    ],
    chanDung: [{ noiDau: 'khong co thoi gian', mongMuon: 'lam nhanh hon' }],
    sanPham: [{ loiIch: 'tiet kiem 3 gio moi tuan', loiKeuGoi: 'dat lich tu van' }],
    insight: [{ bangChung: '12/20 khach nhac toi trong khao sat thang 7' }],
    hoSo: { giongDieu: 'a'.repeat(100), dieuCamKy: 'khong hua chac chan khoi benh' },
  };
}

test('ho so rong la 0% va bi chan', () => {
  const kq = tinhDoDayDu(RONG);
  assert.equal(kq.phanTram, 0);
  assert.equal(kq.duocPhepDeXuat, false);
  assert.equal(kq.conThieu.length, 5);
});

test('ho so day du la 100% va duoc phep', () => {
  const kq = tinhDoDayDu(hoSoDayDu());
  assert.equal(kq.phanTram, 100);
  assert.equal(kq.duocPhepDeXuat, true);
  assert.deepEqual(kq.conThieu, []);
});

test('tong trong so dung bang 100', () => {
  const tong = Object.values(TRONG_SO).reduce((a, b) => a + b, 0);
  assert.equal(tong, 100);
});

test('tru cot: du 3 cai nhung thieu muc dich thi khong tinh', () => {
  const thieu = { ...RONG, truCot: [{ mucDich: 'a' }, { mucDich: '' }, { mucDich: null }] };
  assert.equal(nhomDaDat(thieu).truCot, false);

  const du = { ...RONG, truCot: [{ mucDich: 'a' }, { mucDich: 'b' }, { mucDich: 'c' }] };
  assert.equal(nhomDaDat(du).truCot, true);
});

test('tru cot: 2 cai co muc dich van chua du', () => {
  const dauVao = { ...RONG, truCot: [{ mucDich: 'a' }, { mucDich: 'b' }] };
  assert.equal(nhomDaDat(dauVao).truCot, false);
});

test('chan dung: phai co CA noi dau lan mong muon tren CUNG mot chan dung', () => {
  const tach = {
    ...RONG,
    chanDung: [
      { noiDau: 'ban', mongMuon: null },
      { noiDau: null, mongMuon: 'nhanh' },
    ],
  };
  assert.equal(nhomDaDat(tach).chanDung, false);

  const cung = { ...RONG, chanDung: [{ noiDau: 'ban', mongMuon: 'nhanh' }] };
  assert.equal(nhomDaDat(cung).chanDung, true);
});

test('san pham: phai co ca loi ich lan loi keu goi', () => {
  const thieu = { ...RONG, sanPham: [{ loiIch: 'tot', loiKeuGoi: '  ' }] };
  assert.equal(nhomDaDat(thieu).sanPham, false);
});

test('giong dieu: duoi 100 ky tu chua tinh, va phai co dieu cam ky', () => {
  const ngan = { ...RONG, hoSo: { giongDieu: 'a'.repeat(99), dieuCamKy: 'x' } };
  assert.equal(nhomDaDat(ngan).giongDieu, false);

  const cachTrong = { ...RONG, hoSo: { giongDieu: `  ${'a'.repeat(99)}  `, dieuCamKy: 'x' } };
  assert.equal(nhomDaDat(cachTrong).giongDieu, false, 'khoang trang khong tinh la mo ta');

  const thieuCamKy = { ...RONG, hoSo: { giongDieu: 'a'.repeat(120), dieuCamKy: null } };
  assert.equal(nhomDaDat(thieuCamKy).giongDieu, false);

  const du = { ...RONG, hoSo: { giongDieu: 'a'.repeat(100), dieuCamKy: 'x' } };
  assert.equal(nhomDaDat(du).giongDieu, true);
});

test('insight khong co bang chung thi khong tinh', () => {
  const suong = { ...RONG, insight: [{ bangChung: null }] };
  assert.equal(nhomDaDat(suong).insight, false);
});

test('nguong 60 la ranh gioi chan hay khong', () => {
  // Tru cot 25 + chan dung 25 = 50 -> van bi chan.
  const namMuoi = {
    ...RONG,
    truCot: [{ mucDich: 'a' }, { mucDich: 'b' }, { mucDich: 'c' }],
    chanDung: [{ noiDau: 'x', mongMuon: 'y' }],
  };
  const duoi = tinhDoDayDu(namMuoi);
  assert.equal(duoi.phanTram, 50);
  assert.equal(duoi.duocPhepDeXuat, false);

  // Them san pham 20 -> 70, qua nguong.
  const tren = tinhDoDayDu({ ...namMuoi, sanPham: [{ loiIch: 'x', loiKeuGoi: 'y' }] });
  assert.equal(tren.phanTram, 70);
  assert.equal(tren.duocPhepDeXuat, true);
  assert.ok(tren.phanTram >= NGUONG_CHAN_DE_XUAT);
});

test('cong cho Phase 9 tra ve cau noi ro con thieu gi, khong phai ma loi', () => {
  const kq = kiemTraDeXuat(RONG);
  assert.equal(kq.duocPhep, false);
  assert.equal(kq.phanTram, 0);
  assert.match(kq.lyDo, /60%/);
  assert.match(kq.lyDo, /Trụ cột nội dung/);

  const du = kiemTraDeXuat(hoSoDayDu());
  assert.equal(du.duocPhep, true);
  assert.equal(du.lyDo, null);
});

test('nhom thieu duoc xep theo trong so giam dan', () => {
  const kq = tinhDoDayDu({
    ...RONG,
    hoSo: { giongDieu: 'a'.repeat(100), dieuCamKy: 'x' },
  });
  const trongSo = kq.conThieu.map((t) => t.trongSo);
  assert.deepEqual(trongSo, [...trongSo].sort((a, b) => b - a));
  assert.equal(kq.conThieu[0].trongSo, 25);
});
