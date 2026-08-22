/**
 * Client Secret cua Google chi duoc song o may chu.
 *
 * Next.js chi day bien moi truong co tien to NEXT_PUBLIC_ ra bo goi trinh duyet,
 * nhung mot dong `console.log(process.env)` hay mot import nham tu `auth.ts` vao
 * component client la du de no ra ngoai. Kiem bang cach quet tep that thay vi
 * tin quy uoc.
 */

import 'dotenv/config';

import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

const GOC_DU_AN = path.resolve(import.meta.dirname, '..');

async function lietKe(thuMuc) {
  const ket = [];
  let muc;
  try {
    muc = await readdir(thuMuc, { withFileTypes: true });
  } catch {
    return ket;
  }
  for (const m of muc) {
    const duong = path.join(thuMuc, m.name);
    if (m.isDirectory()) ket.push(...(await lietKe(duong)));
    else ket.push(duong);
  }
  return ket;
}

describe('bo goi phia trinh duyet', () => {
  it('khong chua AUTH_GOOGLE_SECRET hay AUTH_SECRET', async (t) => {
    const thuMuc = path.join(GOC_DU_AN, '.next', 'static');
    const tep = await lietKe(thuMuc);
    if (tep.length === 0) {
      return t.skip('chua co .next/static — chay `npm run build` truoc');
    }

    const canGiu = [process.env.AUTH_GOOGLE_SECRET, process.env.AUTH_SECRET].filter(
      (v) => typeof v === 'string' && v.length >= 8,
    );
    assert.notEqual(canGiu.length, 0, 'AUTH_GOOGLE_SECRET/AUTH_SECRET chua duoc dat, khong kiem duoc');

    for (const duong of tep) {
      const noiDung = await readFile(duong, 'utf8');
      for (const bimat of canGiu) {
        // Chi bao ten tep, tuyet doi khong in gia tri bi mat ra log.
        assert.equal(
          noiDung.includes(bimat),
          false,
          `lo bi mat trong ${path.relative(GOC_DU_AN, duong)}`,
        );
      }
    }
  });

  /**
   * Loi nhac giong khong phai bi mat ky thuat, nhung la tai san bien tap cua
   * kenh: bon khoi giong be mat va giong thuong hieu duoc viet tu content bible.
   * Man soan bai can dem tu va quet tu ngu ngay khi go, va da co lan ca hai keo
   * theo ca file loi nhac vao goi trinh duyet. Bang khoang tu vi vay nam o mot
   * file rieng khong import gi.
   */
  it('khong chua khoi loi nhac giong cua model-runner', async (t) => {
    const tep = await lietKe(path.join(GOC_DU_AN, '.next', 'static'));
    if (tep.length === 0) {
      return t.skip('chua co .next/static — chay `npm run build` truoc');
    }

    const dauVet = ['GIONG THUONG HIEU', 'DO DAI BAT BUOC', 'BE MAT: Fanpage Facebook'];
    for (const duong of tep) {
      const noiDung = await readFile(duong, 'utf8');
      for (const vet of dauVet) {
        assert.equal(
          noiDung.includes(vet),
          false,
          `loi nhac giong lot vao goi trinh duyet (${vet}) tai ${path.relative(GOC_DU_AN, duong)}`,
        );
      }
    }
  });
});
