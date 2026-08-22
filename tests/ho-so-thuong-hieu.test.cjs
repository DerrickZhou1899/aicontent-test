/**
 * Ho so thuong hieu — CRUD nam nhom va cach ly giua cac khong gian lam viec.
 *
 * Cham database that (`aicontent_dev`). Bai quan trong nhat o day la bai cuoi:
 * hai khong gian lam viec khong duoc thay du lieu cua nhau. Day la thu ma neu
 * hong thi khong ai phat hien cho toi luc khach nhin thay ho so cua khach khac.
 */

'use strict';

require('tsx/cjs');
require('dotenv').config();

const assert = require('node:assert/strict');
const { after, test } = require('node:test');

const { createRepo } = require('../lib/data-access/index.ts');
const { tinhDoDayDu } = require('../lib/brand/do-day-du.ts');
const { pool } = require('../db/client.ts');
const { beTest, taoKhongGianTam } = require('./tro-giup-db');

const be = beTest();

after(async () => {
  await be.end();
  await pool.end();
});

/** Tao khong gian tam kem repo cua no. */
async function dungKhongGian(nhan) {
  const kg = await taoKhongGianTam(be, nhan);
  return { ...kg, repo: createRepo(kg.workspaceId) };
}

test('CRUD day du tren mot nhom danh sach', async () => {
  const kg = await dungKhongGian('crud');
  try {
    const { sanPham } = kg.repo;

    assert.deepEqual(await sanPham.list(), []);

    const tao = await sanPham.tao({ ten: 'Goi tu van', loiIch: 'tiet kiem 3 gio' });
    assert.ok(tao.id);
    assert.equal(tao.ten, 'Goi tu van');
    assert.equal(tao.workspaceId, kg.workspaceId);

    const doc = await sanPham.layTheoId(tao.id);
    assert.equal(doc.ten, 'Goi tu van');

    const sua = await sanPham.sua(tao.id, { ten: 'Goi tu van 1:1', gia: '2 trieu' });
    assert.equal(sua.ten, 'Goi tu van 1:1');
    assert.equal(sua.gia, '2 trieu');

    assert.equal((await sanPham.list()).length, 1);

    const xoa = await sanPham.xoa(tao.id);
    assert.equal(xoa.id, tao.id);
    assert.deepEqual(await sanPham.list(), []);
  } finally {
    await kg.don();
  }
});

test('sua/xoa id khong ton tai tra null chu khong nem loi', async () => {
  const kg = await dungKhongGian('khong-co');
  try {
    const idLa = '00000000-0000-4000-8000-000000000000';
    assert.equal(await kg.repo.sanPham.sua(idLa, { ten: 'x' }), null);
    assert.equal(await kg.repo.sanPham.xoa(idLa), null);
    assert.equal(await kg.repo.sanPham.layTheoId(idLa), null);
  } finally {
    await kg.don();
  }
});

test('ghi khong de workspaceId tu payload ghi de duoc', async () => {
  const a = await dungKhongGian('ghi-de-a');
  const b = await dungKhongGian('ghi-de-b');
  try {
    // Nguoi goi co tinh truyen workspace cua B vao repo cua A.
    const dong = await a.repo.sanPham.tao({ ten: 'lach', workspaceId: b.workspaceId });
    assert.equal(dong.workspaceId, a.workspaceId, 'phai ghi vao workspace cua repo');
    assert.deepEqual(await b.repo.sanPham.list(), []);
  } finally {
    await a.don();
    await b.don();
  }
});

test('tru cot giu duoc co khoa_khong_tu_giam', async () => {
  const kg = await dungKhongGian('khoa');
  try {
    const tao = await kg.repo.truCot.tao({
      ten: 'Nuoi duong long tin',
      mucDich: 'xay long tin dai han',
      khoaKhongTuGiam: true,
    });
    assert.equal(tao.khoaKhongTuGiam, true);

    const tat = await kg.repo.truCot.sua(tao.id, { khoaKhongTuGiam: false });
    assert.equal(tat.khoaKhongTuGiam, false);
  } finally {
    await kg.don();
  }
});

test('ho so thuong hieu la ban don: goi hai lan khong tao hai dong', async () => {
  const kg = await dungKhongGian('ban-don');
  try {
    assert.equal(await kg.repo.hoSo.lay(), null);

    const mot = await kg.repo.hoSo.layHoacTao();
    const hai = await kg.repo.hoSo.layHoacTao();
    assert.equal(mot.id, hai.id);

    const luu = await kg.repo.hoSo.luu({ giongDieu: 'than mat', dieuCamKy: 'khong hua chac' });
    assert.equal(luu.id, mot.id);
    assert.equal(luu.giongDieu, 'than mat');
  } finally {
    await kg.don();
  }
});

test('do day du tinh dung tren du lieu that trong database', async () => {
  const kg = await dungKhongGian('do-day-du');
  try {
    const { repo } = kg;

    const doc = async () =>
      tinhDoDayDu({
        hoSo: await repo.hoSo.lay(),
        sanPham: await repo.sanPham.list(),
        chanDung: await repo.chanDung.list(),
        insight: await repo.insight.list(),
        truCot: await repo.truCot.list(),
      });

    assert.equal((await doc()).phanTram, 0);

    for (const ten of ['Nuoi duong', 'Chung minh', 'Chao ban']) {
      await repo.truCot.tao({ ten, mucDich: `muc dich cua ${ten}` });
    }
    assert.equal((await doc()).phanTram, 25);

    await repo.chanDung.tao({ ten: 'Chu shop', noiDau: 'ban', mongMuon: 'dang deu' });
    assert.equal((await doc()).phanTram, 50);
    assert.equal((await doc()).duocPhepDeXuat, false, '50% van phai bi chan');

    await repo.sanPham.tao({ ten: 'Goi tu van', loiIch: 'nhanh', loiKeuGoi: 'dat lich' });
    const bay = await doc();
    assert.equal(bay.phanTram, 70);
    assert.equal(bay.duocPhepDeXuat, true, '70% phai mo');
  } finally {
    await kg.don();
  }
});

test('hai khong gian lam viec khong thay du lieu cua nhau', async () => {
  const a = await dungKhongGian('cach-ly-a');
  const b = await dungKhongGian('cach-ly-b');
  try {
    const cuaA = await a.repo.sanPham.tao({ ten: 'San pham cua A' });
    await a.repo.chanDung.tao({ ten: 'Chan dung cua A' });
    await a.repo.truCot.tao({ ten: 'Tru cot cua A' });
    await a.repo.insight.tao({ noiDung: 'Insight cua A' });
    await a.repo.hoSo.luu({ giongDieu: 'giong cua A' });

    // B doc: khong duoc thay gi cua A.
    assert.deepEqual(await b.repo.sanPham.list(), []);
    assert.deepEqual(await b.repo.chanDung.list(), []);
    assert.deepEqual(await b.repo.truCot.list(), []);
    assert.deepEqual(await b.repo.insight.list(), []);
    assert.equal(await b.repo.hoSo.lay(), null);

    // B biet dung id cua A cung khong doc, sua hay xoa duoc.
    assert.equal(await b.repo.sanPham.layTheoId(cuaA.id), null);
    assert.equal(await b.repo.sanPham.sua(cuaA.id, { ten: 'chiem' }), null);
    assert.equal(await b.repo.sanPham.xoa(cuaA.id), null);

    // Va du lieu cua A con nguyen sau ba lan B thu.
    const conLai = await a.repo.sanPham.layTheoId(cuaA.id);
    assert.equal(conLai.ten, 'San pham cua A');
  } finally {
    await a.don();
    await b.don();
  }
});

/**
 * Codex soat doc lap tim ra: luu ban nhap goi nhieu lenh ghi roi rac, hong o
 * lenh thu ba thi hai lenh dau da vao. Nguoi dung thu lai se sinh ban trung ma
 * khong co cach nao biet phan nao da vao.
 */
test('trongGiaoDich: hong giua chung thi khong dong nao o lai', async () => {
  const { trongGiaoDich } = require('../lib/data-access/index.ts');
  const kg = await dungKhongGian('giao-dich');
  try {
    await assert.rejects(
      trongGiaoDich(kg.workspaceId, async (repo) => {
        await repo.sanPham.tao({ ten: 'San pham 1' });
        await repo.sanPham.tao({ ten: 'San pham 2' });
        throw new Error('hong giua chung');
      }),
      /hong giua chung/,
    );

    const conLai = await kg.repo.sanPham.list();
    assert.deepEqual(conLai, [], 'hai dong ghi truoc luc hong phai bi quay lui');
  } finally {
    await kg.don();
  }
});

test('trongGiaoDich: chay tron thi moi dong deu vao', async () => {
  const { trongGiaoDich } = require('../lib/data-access/index.ts');
  const kg = await dungKhongGian('giao-dich-ok');
  try {
    await trongGiaoDich(kg.workspaceId, async (repo) => {
      await repo.hoSo.luu({ giongDieu: 'than mat' });
      await repo.sanPham.tao({ ten: 'San pham A' });
      await repo.truCot.tao({ ten: 'Tru cot A' });
    });

    assert.equal((await kg.repo.sanPham.list()).length, 1);
    assert.equal((await kg.repo.truCot.list()).length, 1);
    assert.equal((await kg.repo.hoSo.lay()).giongDieu, 'than mat');
  } finally {
    await kg.don();
  }
});

test('trongGiaoDich: van chan workspaceId rong', async () => {
  const { trongGiaoDich } = require('../lib/data-access/index.ts');
  await assert.rejects(
    trongGiaoDich('', async () => undefined),
    /workspaceId bat buoc/,
  );
});

/**
 * Phase 9 buoc 9: bai sinh ra phai luu duoc kem NHAN MO HINH. Khi doi mo hinh
 * mac dinh ma chat luong tut, day la thu duy nhat tra loi duoc "bai nao do mo
 * hinh nao sinh ra".
 */
test('contents.tao luu duoc bai kem nhan mo hinh, dung workspace', async () => {
  const a = await dungKhongGian('luu-bai-a');
  const b = await dungKhongGian('luu-bai-b');
  try {
    const bai = await a.repo.contents.tao({
      beMat: 'tiktok',
      cauMoDau: 'Quay xong 6 doan roi',
      noiDung: 'Noi dung bai thu',
      moHinhDaSinh: 'claude-cli',
      trangThai: 'ban_nhap',
      nguonYTuong: 'may-de-xuat',
    });
    assert.equal(bai.moHinhDaSinh, 'claude-cli');
    assert.equal(bai.beMat, 'tiktok');
    assert.equal(bai.trangThai, 'ban_nhap');
    assert.equal(bai.workspaceId, a.workspaceId);

    // Nguoi goi co tinh truyen workspace cua B vao repo cua A.
    const lach = await a.repo.contents.tao({
      beMat: 'zalo',
      noiDung: 'lach',
      workspaceId: b.workspaceId,
    });
    assert.equal(lach.workspaceId, a.workspaceId, 'phai ghi vao workspace cua repo');
    assert.deepEqual(await b.repo.contents.list(), []);
  } finally {
    await a.don();
    await b.don();
  }
});
