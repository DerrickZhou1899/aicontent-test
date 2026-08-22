require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  dungDuLieuDeXuat,
} = require('../lib/studio/du-lieu-de-xuat.ts');

test('dungDuLieuDeXuat keeps only safe trend formulas and preserves slot order', () => {
  const payload = dungDuLieuDeXuat({
    hoSo           : { giongDieu: 'gan gui', dieuCamKy: 'khong khoa truong' },
    truCot         : [{ ten: 'Gia von', tiLeMucTieu: 0.5 }],
    chanDung       : [{ ten: 'Chu shop moi', noiDau: 'so tinh sai gia' }],
    insight        : [{ noiDung: 'Can hieu cach tinh gia' }],
    lichSuKenhMinh : [{ gocTiepCan: 'giai thich chi phi', cauMoDau: 'Gia von la gi?' }],
    beMat          : 'fanpage',
    soLuong        : 2,
    slot           : [
      {
        khamPha  : false,
        thamKhao : {
          trendSignalId : 'trend-1',
          kieuHook      : 'cau-hoi-nguoc',
          chuDe         : ['gia von', 'mo quan an'],
          soChu         : 42,
          coCTA         : true,
          noiDung       : 'NGUYEN VAN BI CAM',
          tho           : { raw: 'NGUYEN VAN BI CAM' },
        },
      },
      {
        khamPha  : true,
        thamKhao : {
          trendSignalId : 'trend-2',
          kieuHook      : null,
          chuDe         : ['ban hang'],
          soChu         : 18.8,
          coCTA         : false,
        },
      },
    ],
  });

  assert.equal(JSON.stringify(payload).includes('NGUYEN VAN BI CAM'), false);
  assert.deepEqual(payload.slot.map((muc) => muc.khamPha), [false, true]);
  assert.deepEqual(payload.slot[0].thamKhao.chuDe, ['gia von', 'mo quan an']);
  assert.deepEqual(payload.slot[0].thamKhao, {
    trendSignalId : 'trend-1',
    kieuHook      : 'cau-hoi-nguoc',
    chuDe         : ['gia von', 'mo quan an'],
    soChu         : 42,
    coCTA         : true,
  });
  assert.equal(payload.slot[1].thamKhao.soChu, 18);
});

test('dungDuLieuDeXuat reconstructs every group from its service DTO allowlist', () => {
  const payload = dungDuLieuDeXuat({
    hoSo : {
      giongDieu  : 'thang than',
      dieuCamKy  : 'khong hua qua da',
      noiDung    : 'NGUYEN VAN BI CAM',
      rawPayload : { body: 'NGUYEN VAN BI CAM' },
    },
    truCot : [{
      ten         : 'Gia von',
      tiLeMucTieu : 0.6,
      noiDung     : 'NGUYEN VAN BI CAM',
      rawPayload  : 'NGUYEN VAN BI CAM',
    }],
    chanDung : [{
      ten     : 'Chu quan an',
      noiDau  : 'khong biet tinh lai',
      noiDung : 'NGUYEN VAN BI CAM',
      tho     : { raw: 'NGUYEN VAN BI CAM' },
    }],
    insight : [{
      noiDung    : 'Khach can cach tinh gia de tu tin ban hang',
      rawPayload : 'NGUYEN VAN BI CAM',
    }],
    lichSuKenhMinh : [{
      gocTiepCan : 'giai thich gia von',
      cauMoDau   : 'Ban da tinh du chi phi chua?',
      noiDung    : 'NGUYEN VAN BI CAM',
      tho        : { raw: 'NGUYEN VAN BI CAM' },
    }],
    beMat   : 'tiktok',
    soLuong : 3,
    slot    : [],
  });

  assert.deepEqual(payload, {
    hoSo           : { giongDieu: 'thang than', dieuCamKy: 'khong hua qua da' },
    truCot         : [{ ten: 'Gia von', tiLeMucTieu: 0.6 }],
    chanDung       : [{ ten: 'Chu quan an', noiDau: 'khong biet tinh lai' }],
    insight        : [{ noiDung: 'Khach can cach tinh gia de tu tin ban hang' }],
    lichSuKenhMinh : [{
      gocTiepCan : 'giai thich gia von',
      cauMoDau   : 'Ban da tinh du chi phi chua?',
    }],
    beMat   : 'tiktok',
    soLuong : 3,
    slot    : [],
  });
  assert.equal(JSON.stringify(payload).includes('NGUYEN VAN BI CAM'), false);
  assert.equal(JSON.stringify(payload).includes('rawPayload'), false);
  assert.equal(JSON.stringify(payload).includes('Khach can cach tinh gia de tu tin ban hang'), true);
});

test('safe trend contract has no noiDung field in its isolated reference or slot input type', () => {
  const nguon    = readFileSync(join(__dirname, '../lib/studio/du-lieu-de-xuat.ts'), 'utf8');
  const thamKhao = nguon.match(/export type ThamKhaoAnToan = \{([\s\S]*?)\n\};/);
  const slot     = nguon.match(/export type SlotDeXuat = \{([\s\S]*?)\n\};/);
  const duLieu   = nguon.match(/export type DuLieuNguonDeXuat = \{([\s\S]*?)\n\};/);

  assert.ok(thamKhao, 'ThamKhaoAnToan must be declared');
  assert.ok(slot, 'SlotDeXuat must be declared');
  assert.ok(duLieu, 'DuLieuNguonDeXuat must be declared');
  assert.doesNotMatch(thamKhao[1], /\bnoiDung\b/);
  assert.doesNotMatch(slot[1], /\bnoiDung\b/);
  assert.doesNotMatch(duLieu[1], /\bunknown\b/);
  assert.doesNotMatch(nguon, /giaTriJson/);
});
