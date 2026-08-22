'use strict';

/**
 * Test hanh vi cua tang truy cap du lieu.
 *
 * Node 20 khong chay duoc TypeScript, ma `npm test` = `node --test tests/` thi
 * khong them duoc co dong lenh. Nen file test la `.cjs` va nap TypeScript bang
 * moc `require` cua tsx (da co san trong node_modules qua drizzle-kit).
 */

require('tsx/cjs');
require('dotenv').config();

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { after, test } = require('node:test');

const { drizzle } = require('drizzle-orm/node-postgres');
const { eq } = require('drizzle-orm');

const schema = require('../db/schema/index.ts');
const tangTruyCap = require('../lib/data-access/index.ts');
const { createSystemRepo } = require('../lib/data-access/system-repo.ts');
const { db, pool } = require('../db/client.ts');

const { createRepo, taoRepo } = tangTruyCap;

// ---------------------------------------------------------------------------
// 1. Khong co duong nao cam repo ma thieu workspaceId
// ---------------------------------------------------------------------------

for (const [ten, giaTri] of [
  ['chuoi rong', ''],
  ['chi khoang trang', '   '],
  ['undefined', undefined],
  ['null', null],
  ['so 0', 0],
  ['doi tuong', {}],
]) {
  test(`createRepo(${ten}) nem loi`, () => {
    assert.throws(() => createRepo(giaTri), /workspaceId bat buoc/);
  });
}

test('createRepo() khong doi so cung nem loi', () => {
  assert.throws(() => createRepo(), /workspaceId bat buoc/);
});

// ---------------------------------------------------------------------------
// 2. SQL sinh ra luon co dieu kien loc theo workspace
// ---------------------------------------------------------------------------

/** Ket noi gia: khong cham database, chi ghi lai cau SQL that ma Drizzle sinh. */
function ketNoiGhiSql() {
  const nhatKy = [];
  const khachGia = { query: async () => ({ rows: [], rowCount: 0, fields: [] }) };
  const ketNoi = drizzle(khachGia, {
    schema,
    logger: { logQuery: (cau, thamSo) => nhatKy.push({ cau, thamSo }) },
  });
  return { ketNoi, nhatKy };
}

test('moi truy van qua repo deu mang dieu kien loc workspace', async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();
  const repo = taoRepo(ketNoi, 'ws-A');

  const loiGoi = [
    ['contents.list', () => repo.contents.list()],
    ['contents.layTheoId', () => repo.contents.layTheoId(randomUUID())],
    ['jobs.list', () => repo.jobs.list()],
    ['jobs.layTheoId', () => repo.jobs.layTheoId(randomUUID())],
    ['jobs.them', () => repo.jobs.them({ loaiViec: 'sinh-bai' })],
    ['modelRuns.list', () => repo.modelRuns.list()],
    ['modelRuns.ghi', () =>
      repo.modelRuns.ghi({ nhiemVu: 'viet-bai', moHinh: 'claude-cli', thanhCong: true })],
    ['costLog.ghi', () =>
      repo.costLog.ghi({ loaiChiPhi: 'goi-mo-hinh', soLuong: '1', chiPhiUocTinh: '10' })],
    ['costLog.tongTheoThang', () => repo.costLog.tongTheoThang(2026, 8)],
    ['workspaceMembers.list', () => repo.workspaceMembers.list()],
    ['workspaceMembers.laThanhVien', () => repo.workspaceMembers.laThanhVien(randomUUID())],
    ['workspaces.layHienTai', () => repo.workspaces.layHienTai()],
    // Nam nhom ho so thuong hieu (Phase 8). Chung di qua khuon dung chung
    // `crud-theo-workspace.ts`, nen mot loi o khuon la ca nam nhom cung lot —
    // liet ke du ca nam de bai test nay bat duoc.
    ['hoSo.lay', () => repo.hoSo.lay()],
    ['sanPham.list', () => repo.sanPham.list()],
    ['sanPham.layTheoId', () => repo.sanPham.layTheoId(randomUUID())],
    ['sanPham.tao', () => repo.sanPham.tao({ ten: 'thu' })],
    ['sanPham.sua', () => repo.sanPham.sua(randomUUID(), { ten: 'thu' })],
    ['sanPham.xoa', () => repo.sanPham.xoa(randomUUID())],
    ['chanDung.list', () => repo.chanDung.list()],
    ['chanDung.tao', () => repo.chanDung.tao({ ten: 'thu' })],
    ['insight.list', () => repo.insight.list()],
    ['insight.tao', () => repo.insight.tao({ noiDung: 'thu' })],
    ['truCot.list', () => repo.truCot.list()],
    ['truCot.tao', () => repo.truCot.tao({ ten: 'thu' })],
  ];

  for (const [ten, chay] of loiGoi) {
    nhatKy.length = 0;
    await chay();
    assert.equal(nhatKy.length, 1, `${ten}: mong doi dung 1 cau SQL`);

    const { cau, thamSo } = nhatKy[0];
    // Cau ghi neo pham vi bang cot trong danh sach chen; cau doc neo bang dieu
    // kien loc. Bang `workspaces` neo bang chinh cot `id`, cac bang con lai bang
    // `workspace_id`.
    const coPhamVi = cau.startsWith('insert into')
      ? cau.includes('"workspace_id"')
      : cau.includes('"workspace_id" = $') || cau.includes('"workspaces"."id" = $');
    assert.ok(coPhamVi, `${ten}: SQL thieu neo workspace -> ${cau}`);
    assert.ok(thamSo.includes('ws-A'), `${ten}: SQL khong nhan 'ws-A' -> ${thamSo}`);
  }
});

test("contents.list() cua ws-A loc dung workspace_id = 'ws-A'", async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();
  await taoRepo(ketNoi, 'ws-A').contents.list();

  const { cau, thamSo } = nhatKy[0];
  assert.match(cau, /where "contents"\."workspace_id" = \$1/);
  assert.equal(thamSo[0], 'ws-A');
});

test('bo loc nguoi dung khong day duoc dieu kien workspace ra ngoai', async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();
  await taoRepo(ketNoi, 'ws-A').contents.list({ beMat: 'tiktok', trangThai: 'da_dang' });

  const { cau, thamSo } = nhatKy[0];
  assert.match(cau, /"contents"\."workspace_id" = \$1/);
  assert.equal(thamSo[0], 'ws-A');
});

test('ghi du lieu khong ghi de duoc workspaceId tu payload', async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();
  await taoRepo(ketNoi, 'ws-A').jobs.them({
    loaiViec: 'sinh-bai',
    // Ke goi co y day workspace khac vao — phai bi ghi de.
    workspaceId: 'ws-B',
  });

  const { thamSo } = nhatKy[0];
  assert.ok(thamSo.includes('ws-A'), `mong doi ws-A trong tham so: ${thamSo}`);
  assert.ok(!thamSo.includes('ws-B'), `ws-B lot vao cau ghi: ${thamSo}`);
});

// ---------------------------------------------------------------------------
// 3. Cong cua tien trinh nen
// ---------------------------------------------------------------------------

test('index.ts khong re-export createSystemRepo', () => {
  assert.equal(tangTruyCap.createSystemRepo, undefined);
  assert.ok(!Object.keys(tangTruyCap).includes('createSystemRepo'));
});

test('createSystemRepo van bat buoc workspaceId khi quay ve repo co pham vi', () => {
  const heThong = createSystemRepo();
  assert.ok(heThong.dbToanHeThong, 'thieu ban Drizzle cua vai tro tien trinh nen');
  assert.throws(() => heThong.repoTheoWorkspace(''), /workspaceId bat buoc/);
});

// ---------------------------------------------------------------------------
// 4. Database that: hai workspace khong nhin thay du lieu cua nhau
// ---------------------------------------------------------------------------

const idUserA = randomUUID();
const idUserB = randomUUID();
const idWsA = randomUUID();
const idWsB = randomUUID();

test('createRepo(ws-A).contents.list() khong tra ve dong cua ws-B', async () => {
  await db.insert(schema.users).values([
    { id: idUserA, email: `phase5-a-${idUserA}@vi-du.test` },
    { id: idUserB, email: `phase5-b-${idUserB}@vi-du.test` },
  ]);
  await db.insert(schema.workspaces).values([
    { id: idWsA, ten: 'Phase5 A', chuSoHuuId: idUserA },
    { id: idWsB, ten: 'Phase5 B', chuSoHuuId: idUserB },
  ]);
  await db.insert(schema.contents).values([
    { workspaceId: idWsA, beMat: 'fanpage', noiDung: 'bai cua A 1' },
    { workspaceId: idWsA, beMat: 'tiktok', noiDung: 'bai cua A 2' },
    { workspaceId: idWsB, beMat: 'fanpage', noiDung: 'bai MAT cua B' },
  ]);

  const cuaA = await createRepo(idWsA).contents.list();
  const cuaB = await createRepo(idWsB).contents.list();

  assert.equal(cuaA.length, 2);
  assert.equal(cuaB.length, 1);
  assert.ok(cuaA.every((d) => d.workspaceId === idWsA));
  assert.ok(!cuaA.some((d) => d.noiDung.includes('cua B')));
  assert.equal(cuaB[0].noiDung, 'bai MAT cua B');
});

test('layTheoId cua ws-A khong doc duoc dong cua ws-B', async () => {
  const [dongB] = await createRepo(idWsB).contents.list();
  assert.ok(dongB, 'thieu du lieu cua ws-B');

  // Doan dung id that cua workspace khac van khong doc duoc.
  assert.equal(await createRepo(idWsA).contents.layTheoId(dongB.id), null);
  assert.ok(await createRepo(idWsB).contents.layTheoId(dongB.id));
});

test('cost_log cong duoc theo workspace/thang', async () => {
  await createRepo(idWsA).costLog.ghi({
    loaiChiPhi: 'goi-mo-hinh',
    soLuong: '2',
    chiPhiUocTinh: '1500.5',
    ngay: new Date('2026-08-10T03:00:00Z'),
  });
  await createRepo(idWsB).costLog.ghi({
    loaiChiPhi: 'goi-mo-hinh',
    soLuong: '9',
    chiPhiUocTinh: '99999',
    ngay: new Date('2026-08-11T03:00:00Z'),
  });

  const tongA = await createRepo(idWsA).costLog.tongTheoThang(2026, 8);
  assert.equal(tongA.tong, 1500.5);
});

after(async () => {
  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, idWsA));
  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, idWsB));
  await db.delete(schema.users).where(eq(schema.users.id, idUserA));
  await db.delete(schema.users).where(eq(schema.users.id, idUserB));
  await pool.end();
  await createSystemRepo().pool.end();
});
