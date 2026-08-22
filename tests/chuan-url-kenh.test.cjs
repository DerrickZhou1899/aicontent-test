/**
 * Chuan hoa lien ket kenh.
 *
 * Bo test nay giu tien: chuoi nguoi dung go duoc gui THANG cho Apify, va Apify
 * tinh tien theo luot chay ke ca luot chay voi dau vao vo nghia.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  chuanUrlFacebook,
  chuanUrlTheoBeMat,
  chuanUrlTikTok,
} = require('../app/(dash)/cai-dat/kenh/chuan-url.ts');

test('nhan lien ket Facebook that', () => {
  assert.equal(
    chuanUrlFacebook('https://www.facebook.com/duymuoi.dcme'),
    'https://www.facebook.com/duymuoi.dcme',
  );
  assert.equal(
    chuanUrlFacebook('  https://m.facebook.com/thaophamlivestream/  '),
    'https://www.facebook.com/thaophamlivestream',
  );
});

test('bo tham so theo doi khoi lien ket Facebook', () => {
  assert.equal(
    chuanUrlFacebook('https://www.facebook.com/abc?fbclid=xyz&mibextid=1'),
    'https://www.facebook.com/abc',
  );
});

test('tu choi lien ket Facebook khong dung', () => {
  for (const xau of [
    '',
    '   ',
    'facebook.com/abc',
    'http://www.facebook.com/abc',
    'https://facebook.evil.com/abc',
    'https://www.facebook.com/',
    'khong phai url',
  ]) {
    assert.equal(chuanUrlFacebook(xau), null, `phai tu choi: ${xau}`);
  }
});

test('nhan lien ket TikTok dang @ten', () => {
  assert.equal(
    chuanUrlTikTok('https://www.tiktok.com/@anhthobanhang'),
    'https://www.tiktok.com/@anhthobanhang',
  );
  assert.equal(
    chuanUrlTikTok('https://tiktok.com/@abc/'),
    'https://www.tiktok.com/@abc',
  );
});

test('tu choi lien ket TikTok khong phai trang kenh', () => {
  for (const xau of [
    'https://www.tiktok.com/',
    'https://www.tiktok.com/video/123',
    'https://www.tiktok.com/@',
    'https://www.facebook.com/@abc',
    'http://www.tiktok.com/@abc',
  ]) {
    assert.equal(chuanUrlTikTok(xau), null, `phai tu choi: ${xau}`);
  }
});

test('chon dung bo chuan hoa theo be mat', () => {
  assert.equal(
    chuanUrlTheoBeMat('tiktok', 'https://www.tiktok.com/@abc'),
    'https://www.tiktok.com/@abc',
  );
  assert.equal(
    chuanUrlTheoBeMat('fanpage', 'https://www.facebook.com/abc'),
    'https://www.facebook.com/abc',
  );
  assert.equal(
    chuanUrlTheoBeMat('ho_so_ca_nhan', 'https://www.facebook.com/abc'),
    'https://www.facebook.com/abc',
  );
});

test('khong nham be mat: URL TikTok khong qua duoc cua fanpage', () => {
  assert.equal(chuanUrlTheoBeMat('fanpage', 'https://www.tiktok.com/@abc'), null);
  assert.equal(chuanUrlTheoBeMat('tiktok', 'https://www.facebook.com/abc'), null);
});

test('zalo chua co bo keo nen khong nhan', () => {
  assert.equal(chuanUrlTheoBeMat('zalo', 'https://zalo.me/abc'), null);
});
