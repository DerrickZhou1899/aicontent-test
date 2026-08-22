/**
 * Bo loc va dinh dang cua bang "Kenh ngoai kia".
 *
 * VI SAO CO BO TEST NAY: bang chay o trinh duyet, sau lop dang nhap Google —
 * khong co duong nao kiem tu dong bang trinh duyet. Nhung phan de sai nhat lai
 * la ham thuan: quy uoc `null` = KHONG DO DUOC va cu phap `>12` / `<12`. Ca hai
 * kiem duoc o day, khong can trinh duyet.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  giay,
  khopChu,
  khopSo,
  ngayViet,
  so,
  tenDang,
} = require('../app/(dash)/kenh-ngoai/dinh-dang-va-loc.ts');

test('o loc rong thi khong loc gi', () => {
  assert.equal(khopSo('', 5), true);
  assert.equal(khopSo('   ', null), true, 'o rong phai nhan ca bai khong do duoc');
  assert.equal(khopChu('', 'bat ky'), true);
});

test('go so tran la so sanh bang', () => {
  assert.equal(khopSo('12', 12), true);
  assert.equal(khopSo('12', 13), false);
});

test('cu phap > va < so sanh dung chieu', () => {
  assert.equal(khopSo('>50', 51), true);
  assert.equal(khopSo('>50', 50), false, 'lon hon la nghiem ngat');
  assert.equal(khopSo('<50', 49), true);
  assert.equal(khopSo('<50', 50), false);
  assert.equal(khopSo('> 50', 51), true, 'co khoang trang sau dau van phai hieu');
});

test('bai KHONG DO DUOC khong lot qua bo loc so', () => {
  // Neu `null` lot qua, cot so tren bang thanh vo nghia: loc "thich > 0" ma
  // van hien bai khong do duoc thi nguoi dung tuong no bang 0.
  assert.equal(khopSo('>0', null), false);
  assert.equal(khopSo('0', null), false);
});

test('go chu vao o loc so thi bo qua o do thay vi tra bang rong', () => {
  assert.equal(khopSo('abc', 7), true, 'go dang go do phai van thay du lieu');
  assert.equal(khopSo('>abc', 7), true);
});

test('loc chu khong phan biet hoa thuong va tim trong chuoi', () => {
  assert.equal(khopChu('GIA VON', 'ban co biet gia von quyet dinh lai khong'), true);
  assert.equal(khopChu('khong co', 'ban co biet gia von'), false);
});

test('null hien dau gach chu khong hien 0', () => {
  assert.equal(so(null), '—');
  assert.equal(so(0), '0');
  assert.equal(giay(null), '—');
});

test('thoi luong doi sang giay, qua 60 giay thi hien phut', () => {
  assert.equal(giay(45_000), '45s');
  assert.equal(giay(60_000), '1p00');
  assert.equal(giay(95_000), '1p35');
});

test('ngay hien kieu Viet, thieu ngay thi dau gach', () => {
  assert.equal(ngayViet('2026-08-13T03:00:00.000Z'), '13/08/2026');
  assert.equal(ngayViet(null), '—');
});

/**
 * Enum `dang_bai` co BA gia tri. Bo boc kenh ngoai sinh ra ca `anh_chu`, khac
 * bo boc kenh minh (chi `chu` / `kich_ban_quay`) — chia nhi phan la bai anh +
 * caption cua fanpage hien nham thanh "Chu".
 */
test('dang bai co ba gia tri, thieu thi dau gach', () => {
  assert.equal(tenDang('chu'), 'Chữ');
  assert.equal(tenDang('anh_chu'), 'Ảnh');
  assert.equal(tenDang('kich_ban_quay'), 'Video');
  assert.equal(tenDang(null), '—');
});

test('loc cot Dang tim duoc bai anh', () => {
  assert.equal(khopChu('ảnh', tenDang('anh_chu')), true);
  assert.equal(khopChu('ảnh', tenDang('chu')), false, 'bai chu khong duoc lot vao loc "anh"');
  assert.equal(khopChu('video', tenDang('kich_ban_quay')), true);
});
