/**
 * Cong chan chi phi Apify.
 *
 * KHONG goi mang that: truyen mot `fetch` gia vao. Test nay ton tai vi cai no
 * bao ve la tien that, va vi che do hong nguy hiem nhat cua no la "mo khi nghi
 * ngo" — doc khong duoc han muc ma van cho chay.
 */

'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');

const { conChoDeKeo } = require('../lib/keo-bai/tran-chi-phi-apify.ts');

const MOI_TRUONG_CU = { ...process.env };

beforeEach(() => {
  process.env.APIFY_TOKEN = 'gia-de-test';
  delete process.env.APIFY_NGUONG_THEO_DOI;
  delete process.env.APIFY_NGUONG_LOI;
});

afterEach(() => {
  process.env = { ...MOI_TRUONG_CU };
});

/** `fetch` gia tra ve dung hinh dang that cua `GET /v2/users/me/limits`. */
function fetchGia(tranUsd, daDungUsd) {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        limits: { maxMonthlyUsageUsd: tranUsd },
        current: { monthlyUsageUsd: daDungUsd },
      },
    }),
  });
}

test('con nhieu cho thi cho chay', async () => {
  const ket = await conChoDeKeo(0.4, 'theo-doi', fetchGia(50, 10));
  assert.equal(ket.chay, true);
  assert.equal(ket.conLaiUsd, 40);
});

test('uoc tinh lam vuot nguong thi bo luot', async () => {
  // Tran 5, nguong theo doi 80% = 4. Da dung 3.9 + uoc tinh 0.4 = 4.3 > 4.
  const ket = await conChoDeKeo(0.4, 'theo-doi', fetchGia(5, 3.9));
  assert.equal(ket.chay, false);
  assert.match(ket.lyDo, /nguong 80%/);
});

test('cong ca uoc tinh chu khong chi so voi muc hien tai', async () => {
  // Da dung 3.5 < nguong 4, nhung mot luot lon nhay qua nguong ngay trong luc chay.
  const ket = await conChoDeKeo(2, 'theo-doi', fetchGia(5, 3.5));
  assert.equal(ket.chay, false);
});

test('luong loi co nguong rieng, cao hon luong theo doi', async () => {
  // Cung mot muc da dung: theo doi bi chan, luong loi van chay.
  const theoDoi = await conChoDeKeo(0.05, 'theo-doi', fetchGia(5, 4.2));
  const loi = await conChoDeKeo(0.05, 'loi', fetchGia(5, 4.2));
  assert.equal(theoDoi.chay, false, 'theo doi phai bi chan o 80%');
  assert.equal(loi.chay, true, 'luong keo bai cua minh khong duoc chet theo');
});

test('nguong doc duoc tu bien moi truong', async () => {
  process.env.APIFY_NGUONG_THEO_DOI = '10';
  const ket = await conChoDeKeo(0.4, 'theo-doi', fetchGia(50, 10));
  assert.equal(ket.chay, false, 'nguong 10% cua 50 = 5, da dung 10 > 5');
});

test('nguong sai dinh dang thi ve mac dinh, khong mo toang', async () => {
  process.env.APIFY_NGUONG_THEO_DOI = 'khong-phai-so';
  const ket = await conChoDeKeo(0.4, 'theo-doi', fetchGia(5, 4.5));
  assert.equal(ket.chay, false, 'phai roi ve 80%, khong phai bo qua kiem tra');
});

// ---------------------------------------------------------------------------
// MAC DINH DONG — nhom quan trong nhat
// ---------------------------------------------------------------------------

test('mang hong thi luong theo doi bo luot', async () => {
  const ket = await conChoDeKeo(0.4, 'theo-doi', async () => {
    throw new Error('ECONNREFUSED');
  });
  assert.equal(ket.chay, false);
  assert.match(ket.lyDo, /Khong doc duoc han muc/);
});

test('Apify tra ma loi thi luong theo doi bo luot', async () => {
  const ket = await conChoDeKeo(0.4, 'theo-doi', async () => ({
    ok: false,
    status: 401,
    json: async () => ({}),
  }));
  assert.equal(ket.chay, false);
  assert.match(ket.lyDo, /401/);
});

test('phan hoi thieu truong han muc thi luong theo doi bo luot', async () => {
  const ket = await conChoDeKeo(0.4, 'theo-doi', async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: { limits: {}, current: {} } }),
  }));
  assert.equal(ket.chay, false);
  assert.match(ket.lyDo, /thieu truong/);
});

// ---------------------------------------------------------------------------
// LUONG LOI: khong doc duoc han muc thi VAN CHAY
//
// Luong keo bai cua chinh minh da chay production TU TRUOC khi co cong nay, va
// truoc do khong phu thuoc `/limits` chut nao. Mot truc trac tam thoi cua
// endpoint do khong duoc phep lam chet mot tinh nang dang chay.
// ---------------------------------------------------------------------------

test('luong loi VAN CHAY khi mang hong', async () => {
  const ket = await conChoDeKeo(0.05, 'loi', async () => {
    throw new Error('ECONNREFUSED');
  });
  assert.equal(ket.chay, true, 'truc trac /limits khong duoc giet tinh nang dang chay');
});

test('luong loi VAN CHAY khi Apify tra 5xx', async () => {
  const ket = await conChoDeKeo(0.05, 'loi', async () => ({
    ok: false,
    status: 503,
    json: async () => ({}),
  }));
  assert.equal(ket.chay, true);
});

test('luong loi VAN CHAY khi phan hoi thieu truong', async () => {
  const ket = await conChoDeKeo(0.05, 'loi', async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: {} }),
  }));
  assert.equal(ket.chay, true);
});

test('nhung DOC DUOC ma vuot nguong thi luong loi VAN BI CHAN', async () => {
  // Khac han truong hop tren: day la biet chac da het tien, khong phai khong biet.
  const ket = await conChoDeKeo(0.5, 'loi', fetchGia(5, 4.9));
  assert.equal(ket.chay, false, 'biet chac vuot nguong thi phai chan ca luong loi');
  assert.match(ket.lyDo, /nguong 97%/);
});

test('thieu token thi chan CA HAI luong', async () => {
  delete process.env.APIFY_TOKEN;
  for (const loai of ['theo-doi', 'loi']) {
    const ket = await conChoDeKeo(0.05, loai, async () => ({ ok: true, json: async () => ({}) }));
    assert.equal(ket.chay, false, `${loai} phai bi chan khi thieu token`);
  }
});

test('thieu APIFY_TOKEN thi bo luot truoc khi goi mang', async () => {
  delete process.env.APIFY_TOKEN;
  let daGoiMang = false;
  const ket = await conChoDeKeo(0.4, 'theo-doi', async () => {
    daGoiMang = true;
    return { ok: true, status: 200, json: async () => ({}) };
  });
  assert.equal(ket.chay, false);
  assert.equal(daGoiMang, false, 'khong duoc goi mang khi chua co token');
});
