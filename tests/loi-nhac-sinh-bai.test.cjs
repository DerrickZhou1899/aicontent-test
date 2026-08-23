const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const { layLoiNhac } = require('../lib/model-runner/loi-nhac-theo-nhiem-vu');

test('lời nhắc sinh bài bám ý tưởng và dữ liệu thương hiệu có thật', () => {
  const loiNhac = layLoiNhac('viet-bai').loiNhac;

  assert.match(loiNhac, /yTuong/);
  assert.match(loiNhac, /hoSo/);
  assert.match(loiNhac, /truCot/);
  assert.match(loiNhac, /chanDung/);
  assert.match(loiNhac, /khong tu bia/i);
});

test('lời nhắc coi độ dài ép buộc và mạch bài là chỉ dẫn', () => {
  const loiNhac = layLoiNhac('viet-bai').loiNhac;

  assert.match(loiNhac, /epDoDai/);
  assert.match(loiNhac, /BAT BUOC/);
  assert.match(loiNhac, /mach/);
  assert.match(loiNhac, /khong lap/i);
});

test('nhiệm vụ viết bài không còn TODO và giữ hợp đồng JSON', () => {
  const duongDan = join(__dirname, '..', 'lib', 'model-runner', 'loi-nhac-theo-nhiem-vu.js');
  const maNguon  = readFileSync(duongDan, 'utf8');
  const khoi     = maNguon.match(/'viet-bai': \{([\s\S]*?)\n  \},/);

  assert.ok(khoi, 'không tìm thấy nhiệm vụ viet-bai');
  assert.doesNotMatch(khoi[1], /TODO\(bai-test\)/);
  assert.deepEqual(layLoiNhac('viet-bai').truongBatBuoc, ['tieuDe', 'noiDung']);
  assert.match(layLoiNhac('viet-bai').loiNhac, /"hashtag": string\[\]/);
});
