/**
 * Bo boc TikTok + gan muc ve dung kenh.
 *
 * `tests/du-lieu/tho-tiktok.json` la du lieu THAT lay tu mot dataset Apify da
 * co san (0 dong keo them). Boc offline tren tep do thay vi goi lai actor.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const tho = require('./du-lieu/tho-tiktok.json');
const {
  bocMotVideoTikTok,
  dauVaoTikTok,
  tenTaiKhoanTuUrl,
  uocTinhChiPhiTikTok,
  urlKenhCuaMucTikTok,
} = require('../lib/keo-bai/boc-tiktok.ts');
const { duongDanKenh, ganMucVeKenh } = require('../lib/keo-bai/gan-muc-ve-kenh.ts');
const { bocFanpage } = require('../lib/keo-bai/boc-fanpage.ts');

test('ban tho mau con du de test co nghia', () => {
  assert.ok(Array.isArray(tho) && tho.length >= 10);
});

test('boc duoc moi video trong ban tho that', () => {
  const bai = tho.map(bocMotVideoTikTok);
  assert.equal(bai.filter((b) => b === null).length, 0);
});

test('moi video la dang kich ban quay', () => {
  for (const b of tho.map(bocMotVideoTikTok)) {
    assert.equal(b.dangBai, 'kich_ban_quay');
  }
});

test('thoi luong doi tu GIAY sang MILI GIAY', () => {
  const muc = tho.find((m) => m.videoMeta && typeof m.videoMeta.duration === 'number');
  assert.ok(muc, 'ban tho mau khong co video nao co thoi luong');
  const b = bocMotVideoTikTok(muc);
  assert.equal(b.thoiLuongVideoMs, Math.round(muc.videoMeta.duration * 1000));
  assert.ok(b.thoiLuongVideoMs > 1000, 'quen nhan 1000 thi con so se nho vo ly');
});

test('so lieu boc dung con so trong ban tho', () => {
  for (const muc of tho) {
    const b = bocMotVideoTikTok(muc);
    if (typeof muc.diggCount === 'number') assert.equal(b.soThich, muc.diggCount);
    if (typeof muc.commentCount === 'number') assert.equal(b.soBinhLuan, muc.commentCount);
    if (typeof muc.shareCount === 'number') assert.equal(b.soChiaSe, muc.shareCount);
  }
});

test('muc "khong tim thay video" bi bo qua, khong ghi dong rong', () => {
  // Dang that gap trong dataset: chi co authorMeta + note, khong co `id`.
  assert.equal(
    bocMotVideoTikTok({ authorMeta: { name: 'ai do' }, note: 'No videos found', input: '@ai-do' }),
    null,
  );
});

test('doi URL kenh thanh ten tai khoan cho actor', () => {
  assert.equal(tenTaiKhoanTuUrl('https://www.tiktok.com/@abc'), '@abc');
  assert.equal(tenTaiKhoanTuUrl('https://www.tiktok.com/@abc/video/1'), '@abc');
  assert.equal(tenTaiKhoanTuUrl('https://www.tiktok.com/'), null);
  assert.equal(tenTaiKhoanTuUrl('khong phai url'), null);
});

test('dau vao actor TAT phu de tuong minh', () => {
  const dv = dauVaoTikTok(['https://www.tiktok.com/@abc'], 10);
  assert.equal(dv.downloadSubtitlesOptions, 'NEVER_DOWNLOAD_SUB');
  assert.equal(dv.shouldDownloadVideos, false);
  assert.equal(dv.aiVideoSummary, false);
  assert.deepEqual(dv.profiles, ['@abc']);
  assert.equal(dv.resultsPerPage, 10);
});

test('URL sai bi loai khoi dau vao actor, khong gui rac di', () => {
  const dv = dauVaoTikTok(['https://www.tiktok.com/@ok', 'rac'], 5);
  assert.deepEqual(dv.profiles, ['@ok']);
});

test('uoc tinh chi phi TikTok re hon Facebook moi mon', () => {
  assert.ok(uocTinhChiPhiTikTok(1, 10) < 0.05);
});

// ---------------------------------------------------------------------------
// Gan muc ve dung kenh
// ---------------------------------------------------------------------------

test('duong dan kenh dung lam khoa so khop', () => {
  assert.equal(duongDanKenh('https://www.facebook.com/ABC/'), 'abc');
  assert.equal(duongDanKenh('https://www.tiktok.com/@Abc'), '@abc');
  assert.equal(duongDanKenh('https://www.facebook.com/'), null);
});

test('gan dung tung video ve kenh cua no khi mot luot co nhieu kenh', () => {
  const url = [...new Set(tho.map(urlKenhCuaMucTikTok))];
  assert.ok(url.length >= 2, 'ban tho mau phai co it nhat 2 kenh');

  const kenh = url.map((u, i) => ({ id: `k${i}`, urlKenh: u, beMat: 'tiktok' }));
  const { theoKenh, soKhongGan } = ganMucVeKenh(tho, kenh, {
    nguon: 'test',
    bocMotMuc: bocMotVideoTikTok,
    urlKenhCuaMuc: urlKenhCuaMucTikTok,
  });

  assert.equal(soKhongGan, 0, 'moi video phai gan duoc');
  let tong = 0;
  for (const [, muc] of theoKenh) tong += muc.length;
  assert.equal(tong, tho.length, 'khong duoc mat video nao');

  // Kiem nguoc: moi video trong nhom cua mot kenh phai dung kenh do.
  for (const [id, muc] of theoKenh) {
    const urlCuaKenh = kenh.find((k) => k.id === id).urlKenh;
    for (const m of muc) {
      assert.equal(urlKenhCuaMucTikTok(m), urlCuaKenh, 'video bi gan nham kenh');
    }
  }
});

test('luot chi co MOT kenh thi gan het ve no, khong can actor tra truong nao', () => {
  const kenh = [{ id: 'k0', urlKenh: 'https://www.facebook.com/abc', beMat: 'ho_so_ca_nhan' }];
  const { theoKenh, soKhongGan } = ganMucVeKenh([{ khong: 'co gi' }, { cung: 'vay' }], kenh, {
    nguon: 'test',
    bocMotMuc: () => null,
    urlKenhCuaMuc: () => null,
  });
  assert.equal(soKhongGan, 0);
  assert.equal(theoKenh.get('k0').length, 2);
});

test('nhieu kenh ma muc khong gan duoc thi BO QUA, khong gan bua', () => {
  const kenh = [
    { id: 'a', urlKenh: 'https://www.facebook.com/a', beMat: 'fanpage' },
    { id: 'b', urlKenh: 'https://www.facebook.com/b', beMat: 'fanpage' },
  ];
  const { theoKenh, soKhongGan } = ganMucVeKenh([{ khong: 'ro' }], kenh, bocFanpage);
  assert.equal(soKhongGan, 1, 'tha bo con hon gan nham');
  assert.equal(theoKenh.size, 0);
});
