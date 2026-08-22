require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  deXuatYTuong,
  donYTuongTheoSlot,
  khoaChongTrungDeXuat,
  taoSlotDeXuat,
} = require('../lib/studio/de-xuat.ts');

const beMat = 'fanpage';

test('donYTuongTheoSlot keeps each valid idea attached to its raw source slot', () => {
  const slot = [
    {
      khamPha  : false,
      thamKhao : { trendSignalId: 'trend-0', kieuHook: 'hoi', chuDe: ['gia'], soChu: 20, coCTA: false },
    },
    {
      khamPha  : false,
      thamKhao : { trendSignalId: 'trend-1', kieuHook: 'ke', chuDe: ['ban'], soChu: 30, coCTA: true },
    },
    {
      khamPha  : false,
      thamKhao : { trendSignalId: 'trend-2', kieuHook: 'so sanh', chuDe: ['von'], soChu: 40, coCTA: false },
    },
  ];

  const ketQua = donYTuongTheoSlot({
    yTuong : [
      { tieuDe: 'Y tuong 0', truCot: 'Giao duc', chanDung: 'Chu shop' },
      null,
      { tieuDe: 'Y tuong 2', truCot: 'GIAO DUC', chanDung: 'CHU SHOP', trendSignalId: 'model-invented' },
    ],
  }, slot, ['Giao duc'], ['Chu shop'], beMat);

  assert.deepEqual(ketQua.map((y) => ({
    tieuDe        : y.tieuDe,
    trendSignalId : y.trendSignalId,
    khamPha       : y.khamPha,
  })), [
    { tieuDe: 'Y tuong 0', trendSignalId: 'trend-0', khamPha: false },
    { tieuDe: 'Y tuong 2', trendSignalId: 'trend-2', khamPha: false },
  ]);
});

test('taoSlotDeXuat uses exact exploration boundaries without cloning a source', () => {
  const thamKhao = [
    { trendSignalId: 'trend-1', kieuHook: 'hoi', chuDe: ['gia'], soChu: 20, coCTA: false },
    { trendSignalId: 'trend-2', kieuHook: 'ke', chuDe: ['ban'], soChu: 30, coCTA: true },
  ];

  for (const [soLuong, soKhamPha] of [[1, 0], [3, 1], [10, 2], [20, 4]]) {
    const slot    = taoSlotDeXuat(soLuong, thamKhao);
    const idNguon = slot.flatMap((muc) => muc.thamKhao === null
      ? []
      : [muc.thamKhao.trendSignalId]);

    assert.equal(slot.length, soLuong);
    assert.equal(slot.filter((muc) => muc.khamPha).length, soKhamPha);
    assert.ok(slot.filter((muc) => muc.khamPha).every((muc) => muc.thamKhao === null));
    assert.equal(new Set(idNguon).size, idNguon.length);
  }
});

test('khoaChongTrungDeXuat is deterministic for the safe payload', () => {
  const duLieuAnToan = {
    slot  : [{ thamKhao: { chuDe: ['gia'], kieuHook: 'hoi' }, khamPha: true }],
    beMat : 'fanpage',
  };
  const daoThuTuKhoa = {
    beMat : 'fanpage',
    slot  : [{ khamPha: true, thamKhao: { kieuHook: 'hoi', chuDe: ['gia'] } }],
  };

  assert.equal(
    khoaChongTrungDeXuat('workspace-a', 'fanpage', duLieuAnToan),
    khoaChongTrungDeXuat('workspace-a', 'fanpage', daoThuTuKhoa),
  );
  assert.notEqual(
    khoaChongTrungDeXuat('workspace-a', 'fanpage', duLieuAnToan),
    khoaChongTrungDeXuat('workspace-a', 'tiktok', duLieuAnToan),
  );
  assert.notEqual(
    khoaChongTrungDeXuat('workspace-a', 'fanpage', duLieuAnToan),
    khoaChongTrungDeXuat('workspace-a', 'fanpage', { ...daoThuTuKhoa, beMat: 'zalo' }),
  );
});

test('deXuatYTuong keeps one-argument arity', () => {
  assert.equal(typeof deXuatYTuong, 'function');
  assert.equal(deXuatYTuong.length, 1);
});
