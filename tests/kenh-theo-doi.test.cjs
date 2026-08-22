/**
 * Kenh theo doi + TRUC CO LAP THU HAI (nguoi dung trong cung workspace).
 *
 * VI SAO BO TEST NAY TON TAI: truc `workspace_id` duoc ep o ba lop va co bo quet
 * ma canh gac. Truc nguoi dung thi moi, va bo quet khong nhin thay no — mot
 * truy van quen `user_id` van qua het moi la chan hien co. Cho nay phai co test
 * hanh vi that tren co so du lieu that.
 *
 * Tu bo qua neu khong ket noi duoc DB, giong cac bo test cham DB khac.
 */

'use strict';

require('tsx/cjs');
require('dotenv').config();

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const { createRepo, kiemUserId } = require('../lib/data-access/index.ts');
const { beTest, taoKhongGianTam } = require('./tro-giup-db');

const be = beTest();

let ws;
let nguoiA;
let nguoiB;
let repo;
let boQua = false;

before(async () => {
  try {
    ws = await taoKhongGianTam(be, 'kenh-theo-doi');
  } catch (loi) {
    boQua = true;
    return;
  }
  // Nguoi thu hai trong CUNG mot workspace — day la kich ban chua tung co test.
  const them = await be.query(
    'INSERT INTO users (ten, email) VALUES ($1, $2) RETURNING id',
    ['test nguoi B', `test-b-${Date.now()}@vi-du.invalid`],
  );
  nguoiA = kiemUserId(ws.userId);
  nguoiB = kiemUserId(them.rows[0].id);
  await be.query(
    'INSERT INTO workspace_members (workspace_id, user_id, vai_tro) VALUES ($1, $2, $3)',
    [ws.workspaceId, nguoiB.userId, 'thanh_vien'],
  );
  repo = createRepo(ws.workspaceId);
});

after(async () => {
  if (!boQua && ws) {
    await be.query('DELETE FROM users WHERE id = $1', [nguoiB.userId]);
    await ws.don();
  }
  await be.end();
});

test('kho kenh la cua chung: hai nguoi them cung URL chi ra mot dong', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const mot = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/vi-du-chung');
  const hai = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/vi-du-chung');
  assert.equal(mot.id, hai.id, 'them lai cung URL phai tra dong cu, khong tao dong thu hai');
});

test('danh sach theo doi la rieng tung nguoi', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const kenh = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/chi-A-theo');
  await repo.theoDoiCuaToi.bat(nguoiA, kenh.id);

  const cuaA = await repo.theoDoiCuaToi.cuaNguoiDung(nguoiA);
  const cuaB = await repo.theoDoiCuaToi.cuaNguoiDung(nguoiB);

  assert.ok(cuaA.some((k) => k.id === kenh.id), 'A phai thay kenh minh theo');
  assert.ok(!cuaB.some((k) => k.id === kenh.id), 'B KHONG duoc thay kenh cua A');
});

test('B thay kenh trong bang chung nhung o danh dau theo doi khong tich', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const kenh = await repo.kenhTheoDoi.themKenh('tiktok', 'https://www.tiktok.com/@vi-du');
  await repo.theoDoiCuaToi.bat(nguoiA, kenh.id);

  const bangCuaB = await repo.kenhTheoDoi.danhSachChoNguoi(nguoiB);
  const dong = bangCuaB.find((k) => k.id === kenh.id);
  assert.ok(dong, 'kho kenh la cua chung nen B van thay kenh trong bang');
  assert.equal(dong.toiTheoDoi, false, 'nhung o "toi theo doi" cua B khong duoc tich');
  assert.equal(dong.soNguoiTheoDoi, 1);
});

test('tin hieu chi den tay nguoi co theo doi kenh do', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const kenh = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/co-tin-hieu');
  await repo.theoDoiCuaToi.bat(nguoiA, kenh.id);

  await repo.tinHieuXuHuong.luuNhieu([
    {
      kenhTheoDoiId: kenh.id,
      nguon: 'test',
      maBai: 'bai-1',
      lienKet: 'https://www.facebook.com/co-tin-hieu/posts/1',
      noiDung: 'Ban co biet gia von quyet dinh lai khong?',
      thoiDiem: new Date(),
      dangBai: 'chu',
      soThich: 112,
      soBinhLuan: 0,
      soChiaSe: null,
      thoiLuongVideoMs: null,
      tho: { nguyen: 'van' },
    },
  ]);

  const cuaA = await repo.tinHieuXuHuong.theoNguoiDung(nguoiA, 20);
  const cuaB = await repo.tinHieuXuHuong.theoNguoiDung(nguoiB, 20);

  assert.equal(cuaA.length, 1, 'A theo kenh nay nen phai nhan duoc tin hieu');
  assert.equal(cuaB.length, 0, 'B khong theo kenh nay nen KHONG duoc nhan gi');
});

test('null khac 0 o cot so lieu', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const cuaA = await repo.tinHieuXuHuong.theoNguoiDung(nguoiA, 20);
  const bai = cuaA.find((b) => b.maBai === 'bai-1');
  assert.equal(bai.soBinhLuan, 0, '0 nghia la do duoc va bang khong');
  assert.equal(bai.soChiaSe, null, 'null nghia la KHONG DO DUOC, khong duoc thanh 0');
});

test('tieu de sinh tu dong dau cua noi dung (cot tieu_de la NOT NULL)', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const cuaA = await repo.tinHieuXuHuong.theoNguoiDung(nguoiA, 20);
  const bai = cuaA.find((b) => b.maBai === 'bai-1');
  assert.equal(bai.tieuDe, 'Ban co biet gia von quyet dinh lai khong?');
});

test('keo lai bai da co thi bo qua, khong loi', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const kenh = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/co-tin-hieu');
  const bai = {
    kenhTheoDoiId: kenh.id,
    nguon: 'test',
    maBai: 'bai-1',
    lienKet: null,
    noiDung: 'Ban co biet gia von quyet dinh lai khong?',
    thoiDiem: new Date(),
    dangBai: 'chu',
    soThich: 999,
    soBinhLuan: null,
    soChiaSe: null,
    thoiLuongVideoMs: null,
    tho: {},
  };
  const soMoi = await repo.tinHieuXuHuong.luuNhieu([bai]);
  assert.equal(soMoi, 0, 'bai da co thi khong them dong moi');
});

test('canKeo bo qua kenh khong ai theo doi', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const bo = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/khong-ai-theo');
  const danhSach = await repo.kenhTheoDoi.canKeo(0);
  assert.ok(
    !danhSach.some((k) => k.id === bo.id),
    'kenh khong ai theo doi thi khong duoc ton tien keo',
  );
});

test('canKeo bo qua kenh da tat', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const kenh = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/se-tat');
  await repo.theoDoiCuaToi.bat(nguoiA, kenh.id);
  await repo.kenhTheoDoi.datHoatDong(kenh.id, false);
  const danhSach = await repo.kenhTheoDoi.canKeo(0);
  assert.ok(!danhSach.some((k) => k.id === kenh.id));
});

test('canKeo khong tra trung khi nhieu nguoi cung theo mot kenh', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const kenh = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/ca-hai-theo');
  await repo.theoDoiCuaToi.bat(nguoiA, kenh.id);
  await repo.theoDoiCuaToi.bat(nguoiB, kenh.id);
  const danhSach = await repo.kenhTheoDoi.canKeo(0);
  const soLan = danhSach.filter((k) => k.id === kenh.id).length;
  assert.equal(soLan, 1, 'hai nguoi cung theo mot kenh van chi MOT luot keo');
});

test('khong bat theo doi duoc kenh cua workspace KHAC', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  // `kenhId` di tu trinh duyet len qua server action; khoa ngoai chi bat kenh do
  // TON TAI chu khong bat no thuoc workspace nay.
  const wsKhac = await taoKhongGianTam(be, 'ws-khac');
  const repoKhac = createRepo(wsKhac.workspaceId);
  const kenhLa = await repoKhac.kenhTheoDoi.themKenh(
    'fanpage',
    'https://www.facebook.com/cua-workspace-khac',
  );

  await repo.theoDoiCuaToi.bat(nguoiA, kenhLa.id);

  const cuaA = await repo.theoDoiCuaToi.cuaNguoiDung(nguoiA);
  assert.ok(
    !cuaA.some((k) => k.id === kenhLa.id),
    'khong duoc tao dong theo doi tro sang kenh cua workspace khac',
  );
  const dong = await be.query(
    'select count(*)::int c from theo_doi_cua_toi where kenh_theo_doi_id=$1',
    [kenhLa.id],
  );
  assert.equal(dong.rows[0].c, 0, 'khong duoc de lai rac trong bang');

  await wsKhac.don();
});

test('tat kenh khong xoa bai da keo ve', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const truoc = await repo.tinHieuXuHuong.theoNguoiDung(nguoiA, 50);
  const kenh = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/co-tin-hieu');
  await repo.kenhTheoDoi.datHoatDong(kenh.id, false);
  const sau = await repo.tinHieuXuHuong.theoNguoiDung(nguoiA, 50);
  assert.equal(sau.length, truoc.length, 'tat chi ngung keo, khong dung toi bai da co');
});

// ==== Man tra cuu bai kenh ngoai (`theoNguoiDungDeTraCuu`) ====

test('man tra cuu cung chan theo truc nguoi dung', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const cuaA = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiA, 50);
  const cuaB = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiB, 50);

  assert.ok(cuaA.length > 0, 'A theo nhieu kenh nen phai co bai de tra cuu');
  assert.equal(cuaB.length, 0, 'B khong theo kenh nao nen bang cua B phai rong');
});

test('man tra cuu tra kem ten va URL kenh cho cot "Kenh"', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const cuaA = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiA, 50);
  const bai = cuaA.find((b) => b.maBai === 'bai-1');
  assert.equal(bai.urlKenh, 'https://www.facebook.com/co-tin-hieu');
  // `ten_hien_thi` chua bao gio duoc bo boc ghi vao — trang phai chiu duoc null.
  assert.equal(bai.tenKenh, null);
});

test('man tra cuu giu nguyen null o cot so lieu', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const cuaA = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiA, 50);
  const bai = cuaA.find((b) => b.maBai === 'bai-1');
  assert.equal(bai.soBinhLuan, 0, '0 la do duoc va bang khong');
  assert.equal(bai.soChiaSe, null, 'null la KHONG DO DUOC, khong duoc thanh 0');
});

/**
 * Postgres xep NULL LEN DAU khi sap giam dan. `thoi_diem` co that duong sinh
 * null (`ngayAn()` tra null khi khong doc duoc ngay), nen `desc` tran nghia la
 * mot me bai khong co ngay day het bai moi nhat ra khoi `gioiHan`.
 */
test('bai khong co ngay bi day xuong cuoi, khong chiem cho bai moi', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const kenh = await repo.kenhTheoDoi.themKenh('fanpage', 'https://www.facebook.com/co-tin-hieu');
  await repo.theoDoiCuaToi.bat(nguoiA, kenh.id);
  await repo.tinHieuXuHuong.luuNhieu([
    {
      kenhTheoDoiId: kenh.id,
      nguon: 'test',
      maBai: 'bai-khong-ngay',
      lienKet: null,
      noiDung: 'Bai khong doc duoc ngay dang',
      thoiDiem: null,
      dangBai: 'chu',
      soThich: null,
      soBinhLuan: null,
      soChiaSe: null,
      thoiLuongVideoMs: null,
      tho: {},
    },
  ]);

  const cuaA = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiA, 50);
  assert.ok(cuaA.length > 1, 'can it nhat hai bai de so thu tu');
  assert.notEqual(cuaA[0].maBai, 'bai-khong-ngay', 'bai khong co ngay khong duoc dung dau bang');
  assert.equal(cuaA[cuaA.length - 1].maBai, 'bai-khong-ngay', 'no phai nam cuoi');
});

/** Bang tra cuu KHONG duoc keo `tho` — ban thô Apify vai chuc KB moi muc. */
test('man tra cuu khong keo cot tho va cong thuc ve', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const cuaA = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiA, 50);
  assert.ok(cuaA.length > 0);
  assert.equal('tho' in cuaA[0], false, 'ban thô khong duoc roi vao truy van man hinh');
  assert.equal('congThuc' in cuaA[0], false);
});

/**
 * Day la LY DO ham nay ton tai tach khoi `theoNguoiDung`. Neu ai do gop hai ham
 * lam mot, test nay do truoc.
 */
test('man tra cuu VAN hien bai da sinh thanh y tuong, khac bo sinh y tuong', async (t) => {
  if (boQua) return t.skip('khong ket noi duoc DB');
  const truoc = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiA, 50);
  const bai = truoc.find((b) => b.maBai === 'bai-1');
  await repo.tinHieuXuHuong.danhDauDaDung([bai.id]);

  const choSinh = await repo.tinHieuXuHuong.theoNguoiDung(nguoiA, 50);
  const choTraCuu = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoiA, 50);

  assert.ok(
    !choSinh.some((b) => b.id === bai.id),
    'bo sinh y tuong khong duoc cap lai bai da dung',
  );
  assert.ok(
    choTraCuu.some((b) => b.id === bai.id),
    'man tra cuu VAN phai tim lai duoc bai da dung',
  );
});
