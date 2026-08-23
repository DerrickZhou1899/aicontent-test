const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const { layLoiNhac } = require('../lib/model-runner/loi-nhac-theo-nhiem-vu');

test('lời nhắc kịch bản bám ý tưởng và dữ liệu thương hiệu có thật', () => {
  const loiNhac = layLoiNhac('viet-kich-ban').loiNhac;

  assert.match(loiNhac, /yTuong/);
  assert.match(loiNhac, /hoSo/);
  assert.match(loiNhac, /khong tu bia/i);
  assert.match(loiNhac, /thoiLuongMucTieuGiay/);
});

test('lời nhắc yêu cầu từng cảnh quay được và lời thoại nói được', () => {
  const loiNhac = layLoiNhac('viet-kich-ban').loiNhac;

  assert.match(loiNhac, /moi phan canh/i);
  assert.match(loiNhac, /hinhAnh/);
  assert.match(loiNhac, /loiThoai/);
  assert.match(loiNhac, /noi duoc/i);
});

test('nhiệm vụ kịch bản không còn TODO và giữ hợp đồng JSON', () => {
  const duongDan = join(__dirname, '..', 'lib', 'model-runner', 'loi-nhac-theo-nhiem-vu.js');
  const maNguon  = readFileSync(duongDan, 'utf8');
  const khoi     = maNguon.match(/'viet-kich-ban': \{([\s\S]*?)\n  \},/);

  assert.ok(khoi, 'không tìm thấy nhiệm vụ viet-kich-ban');
  assert.doesNotMatch(khoi[1], /TODO\(bai-test\)/);
  assert.deepEqual(layLoiNhac('viet-kich-ban').truongBatBuoc, ['tieuDe', 'phanCanh']);
  assert.match(layLoiNhac('viet-kich-ban').loiNhac, /"thoiLuongGiay": number/);
});
