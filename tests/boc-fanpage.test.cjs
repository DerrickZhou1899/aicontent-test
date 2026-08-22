/**
 * Bo boc fanpage, chay tren BAN THO THAT da luu.
 *
 * `tests/du-lieu/tho-fanpage.json` la ket qua luot chay that ngay 13/08/2026
 * (run `mkaQtdcNacxlD407k`, 2 trang x 10 bai, $0,066). Boc offline tren tep do
 * thay vi goi lai actor: moi luot chay la tien that, va sua bo boc la viec phai
 * lam di lam lai.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const tho = require('./du-lieu/tho-fanpage.json');
const {
  bocMotBaiFanpage,
  uocTinhChiPhiFanpage,
  urlKenhCuaMuc,
} = require('../lib/keo-bai/boc-fanpage.ts');

test('ban tho mau van con day du de test co nghia', () => {
  assert.ok(Array.isArray(tho) && tho.length >= 20, 'can it nhat 20 muc mau');
});

test('boc duoc moi muc trong ban tho that', () => {
  const bai = tho.map(bocMotBaiFanpage);
  const hong = bai.filter((b) => b === null);
  assert.equal(hong.length, 0, `${hong.length} muc khong boc duoc`);
});

test('moi bai co ma bai va lien ket', () => {
  for (const b of tho.map(bocMotBaiFanpage)) {
    assert.ok(b.maBai && b.maBai.length > 0, 'thieu maBai');
    assert.ok(b.urlBai && b.urlBai.startsWith('http'), `lien ket sai: ${b.urlBai}`);
  }
});

test('ma bai khong trung nhau trong mot luot', () => {
  const ma = tho.map(bocMotBaiFanpage).map((b) => b.maBai);
  assert.equal(new Set(ma).size, ma.length, 'co ma bai trung — chong trung se bo nham bai');
});

test('so lieu boc ra dung con so trong ban tho', () => {
  // Doi chieu tung bai voi truong goc, khong tin bo boc tu khai.
  for (const muc of tho) {
    const b = bocMotBaiFanpage(muc);
    if (typeof muc.likes === 'number') assert.equal(b.soThich, muc.likes);
    if (typeof muc.comments === 'number') assert.equal(b.soBinhLuan, muc.comments);
    if (typeof muc.shares === 'number') assert.equal(b.soChiaSe, muc.shares);
  }
});

test('so 0 giu nguyen la 0, khong bien thanh null', () => {
  const coSoKhong = tho.filter((m) => m.likes === 0 || m.comments === 0 || m.shares === 0);
  if (coSoKhong.length === 0) return; // ban tho nay khong co ca 0 nao
  for (const muc of coSoKhong) {
    const b = bocMotBaiFanpage(muc);
    if (muc.comments === 0) assert.equal(b.soBinhLuan, 0, '0 la do duoc va bang khong');
    if (muc.shares === 0) assert.equal(b.soChiaSe, 0);
  }
});

test('video nhan dung dang bai va co thoi luong', () => {
  const video = tho.filter((m) => m.isVideo === true);
  assert.ok(video.length > 0, 'ban tho mau khong co video nao — test nay vo nghia');
  for (const muc of video) {
    const b = bocMotBaiFanpage(muc);
    assert.equal(b.dangBai, 'kich_ban_quay');
  }
});

test('bai khong phai video thi la chu hoac anh_chu', () => {
  for (const muc of tho.filter((m) => m.isVideo !== true)) {
    const b = bocMotBaiFanpage(muc);
    assert.ok(['chu', 'anh_chu'].includes(b.dangBai), `dang bai la ${b.dangBai}`);
  }
});

test('ngay dang doc duoc', () => {
  for (const b of tho.map(bocMotBaiFanpage)) {
    assert.ok(b.ngayDang instanceof Date, 'ngay dang phai la Date');
    assert.ok(!Number.isNaN(b.ngayDang.getTime()), 'ngay dang khong doc duoc');
  }
});

test('gan duoc moi bai ve dung kenh cua no', () => {
  const url = new Set(tho.map(urlKenhCuaMuc));
  assert.equal(url.size, 2, 'ban tho co 2 trang nen phai gan ra dung 2 URL kenh');
  for (const muc of tho) {
    assert.ok(urlKenhCuaMuc(muc), 'moi muc phai gan duoc ve mot kenh');
  }
});

test('ban tho giu lai nguyen ven de boc lai khong ton tien', () => {
  const b = bocMotBaiFanpage(tho[0]);
  assert.ok(b.tho && typeof b.tho === 'object', 'phai giu ban tho');
});

test('uoc tinh chi phi khop voi luot chay that trong khoang 30%', () => {
  // Luot that: 2 trang x 10 bai = $0,066.
  const uoc = uocTinhChiPhiFanpage(2, 10);
  const that = 0.066;
  const lech = Math.abs(uoc - that) / that;
  assert.ok(lech < 0.3, `uoc tinh ${uoc} lech ${(lech * 100).toFixed(0)}% so voi ${that}`);
});

test('muc rac khong lam do bo boc', () => {
  assert.equal(bocMotBaiFanpage({}), null, 'muc khong co ma bai thi bo qua');
  assert.equal(bocMotBaiFanpage({ text: 'co chu nhung khong co ma' }), null);
});
