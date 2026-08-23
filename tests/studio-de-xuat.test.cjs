require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  donKetQuaDeXuat,
  taoDichVuDeXuat,
  raiTheoTruCot,
  TI_LE_KHAM_PHA,
} = require('../lib/studio/de-xuat.ts');

const beMat = 'fanpage';

test('uses the required exploration ratio', () => {
  assert.equal(TI_LE_KHAM_PHA, 0.2);
});

test('donKetQuaDeXuat trims fields and canonicalizes known names', () => {
  const ketQua = donKetQuaDeXuat({
    yTuong : [{
      tieuDe     : '  Một tiêu đề  ',
      truCot     : '  GIAO DỤC  ',
      chanDung   : '  chu shop moi  ',
      gocTiepCan : '  Góc thật  ',
      cauMoDau   : '  Mở đầu  ',
      lyDoDeXuat : '  Vì phù hợp  ',
      beMat      : 'tiktok',
      khamPha    : true,
    }],
  }, ['Giáo dục', 'Bán hàng'], ['Chủ shop mới'], beMat);

  assert.deepEqual(ketQua, [{
    tieuDe     : 'Một tiêu đề',
    truCot     : 'Giáo dục',
    chanDung   : 'Chủ shop mới',
    gocTiepCan : 'Góc thật',
    cauMoDau   : 'Mở đầu',
    lyDoDeXuat : 'Vì phù hợp',
    beMat,
    khamPha : true,
  }]);
});

test('donKetQuaDeXuat nulls unknown optionals and drops malformed ideas', () => {
  const ketQua = donKetQuaDeXuat({
    yTuong : [
      null,
      'not an object',
      { tieuDe: '   ' },
      { tieuDe: 42 },
      {
        tieuDe     : '  Hợp lệ ',
        truCot     : 'Không tồn tại',
        chanDung   : {},
        gocTiepCan : '   ',
        cauMoDau   : null,
        lyDoDeXuat : undefined,
        beMat      : 'zalo',
        khamPha    : 1,
      },
    ],
  }, ['Giáo dục'], ['Chủ shop mới'], beMat);

  assert.deepEqual(ketQua, [{
    tieuDe     : 'Hợp lệ',
    truCot     : null,
    chanDung   : null,
    gocTiepCan : null,
    cauMoDau   : null,
    lyDoDeXuat : null,
    beMat,
    khamPha : false,
  }]);
  assert.deepEqual(donKetQuaDeXuat({ yTuong: 'not an array' }, [], [], beMat), []);
});

test('raiTheoTruCot uses largest remainder and preserves pillar order', () => {
  const bonYTuong = [
    { tieuDe: 'a', truCot: 'A' },
    { tieuDe: 'b', truCot: 'B' },
    { tieuDe: 'c', truCot: 'C' },
    { tieuDe: 'a2', truCot: 'A' },
    { tieuDe: 'b2', truCot: 'B' },
    { tieuDe: 'c2', truCot: 'C' },
    { tieuDe: 'a3', truCot: 'A' },
    { tieuDe: 'b3', truCot: 'B' },
    { tieuDe: 'c3', truCot: 'C' },
    { tieuDe: 'a4', truCot: 'A' },
    { tieuDe: 'a5', truCot: 'A' },
  ];

  const ketQua = raiTheoTruCot(bonYTuong, [
    { ten: 'A', tiLeMucTieu: 0.5 },
    { ten: 'B', tiLeMucTieu: 0.3 },
    { ten: 'C', tiLeMucTieu: 0.2 },
  ], 10);

  assert.deepEqual(ketQua.map((y) => y.tieuDe), ['a', 'a2', 'a3', 'a4', 'a5', 'b', 'b2', 'b3', 'c', 'c2']);
});

test('raiTheoTruCot does not clone, caps results, and handles shortage deterministically', () => {
  const a         = { tieuDe: 'a', truCot: 'A' };
  const khongBiet = { tieuDe: 'unknown', truCot: null };
  const bonYTuong = [a, a, khongBiet, { tieuDe: 'b', truCot: 'B' }];
  const mucTieu   = [
    { ten: 'A', tiLeMucTieu: 0.75 },
    { ten: 'B', tiLeMucTieu: 0.25 },
    { ten: 'C', tiLeMucTieu: null },
  ];

  const lanMot = raiTheoTruCot(bonYTuong, mucTieu, 10);
  const lanHai = raiTheoTruCot(bonYTuong, mucTieu, 10);

  assert.deepEqual(lanMot, [a, { tieuDe: 'b', truCot: 'B' }, khongBiet]);
  assert.deepEqual(lanMot, lanHai);
  assert.equal(lanMot.includes(a), true);
  assert.equal(lanMot.length, 3);
  assert.ok(lanMot.every((y) => bonYTuong.includes(y)));
});

test('raiTheoTruCot lets null or unknown pillars fill only remaining capacity', () => {
  const bonYTuong = [
    { tieuDe: 'a', truCot: 'A' },
    { tieuDe: 'unknown', truCot: 'Khác' },
    { tieuDe: 'b', truCot: 'B' },
  ];

  const ketQua = raiTheoTruCot(bonYTuong, [
    { ten: 'A', tiLeMucTieu: 0.5 },
    { ten: 'B', tiLeMucTieu: 0.5 },
  ], 3);

  assert.deepEqual(ketQua.map((y) => y.tieuDe), ['a', 'b', 'unknown']);
});

test('taoDichVuDeXuat is available for behavior-level service tests', () => {
  assert.equal(typeof taoDichVuDeXuat, 'function');
});
