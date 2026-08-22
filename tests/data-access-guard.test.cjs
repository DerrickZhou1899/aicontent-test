'use strict';

/**
 * Test quet ma — ly do Phase 5 ton tai.
 *
 * Hai phan:
 *   1. Quet ma nguon that: khong duoc co duong vong nao.
 *   2. Tu kiem bo quet bang noi dung gia: mot bo quet khong bao gio bao loi thi
 *      cung "PASS" nhu mot bo quet dung, nen phai chung minh no bat duoc that.
 */

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { lietKeTepMa, moTaViPham, quetNoiDung, quetToanBo } = require('./quet-tang-truy-cap.cjs');

// ---------------------------------------------------------------------------
// 1. Ma nguon that
// ---------------------------------------------------------------------------

test('ma nguon that khong co duong vong tang truy cap du lieu', () => {
  const tep = lietKeTepMa();
  assert.ok(tep.length > 0, 'khong quet duoc file nao — bo quet hong');

  const viPham = quetToanBo();
  assert.deepEqual(
    viPham,
    [],
    `Co truy van khong di qua lib/data-access/:\n${moTaViPham(viPham)}`,
  );
});

test('bo quet nhin thay dung cac thu muc ma nguon', () => {
  const tep = lietKeTepMa();
  assert.ok(tep.includes('db/client.ts'));
  assert.ok(tep.includes('lib/data-access/index.ts'));
  assert.ok(tep.some((p) => p.startsWith('app/')));
  assert.ok(!tep.some((p) => p.startsWith('node_modules/')));
  assert.ok(!tep.some((p) => p.startsWith('tests/')));
});

// ---------------------------------------------------------------------------
// 2. Tu kiem: tung luat phai bat duoc
// ---------------------------------------------------------------------------

const CHAN = [
  ['import-db-client', 'app/(dash)/x/page.tsx', "import { db } from '@/db/client';"],
  ['import-db-client', 'app/(dash)/x/page.tsx', "import * as k from '../../../db/client';"],
  ['import-db-client', 'lib/y/z.ts', "const k = require('@/db/client');"],
  ['import-db-client', 'lib/y/z.ts', "const k = await import('@/db/client.ts');"],
  ['import-ten-db', 'app/api/z/route.ts', "import { db } from '@/lib/vong-veo';"],
  ['import-ten-db', 'app/api/z/route.ts', "import {\n  db as ketNoi,\n} from './cho-khac';"],
  ['import-ten-db', 'lib/y/z.ts', "const { db } = require('./cho-khac');"],
  ['goi-drizzle', 'lib/y/z.ts', "const k = drizzle(pool, { schema });"],
  ['tu-mo-ket-noi-pg', 'lib/y/z.ts', "const p = new Pool({ connectionString: s });"],
  ['tu-mo-ket-noi-pg', 'workers/model/index.ts', "const c = new Client(s);"],
  ['system-repo-sai-cho', 'app/api/z/route.ts', 'const r = createSystemRepo();'],
  [
    'system-repo-sai-cho',
    'app/api/z/route.ts',
    "import { createSystemRepo } from '@/lib/data-access/system-repo';",
  ],
  ['system-repo-sai-cho', 'lib/bao-cao/tong-hop.ts', 'createSystemRepo();'],
  ['taoRepo-sai-cho', 'app/api/z/route.ts', 'const r = taoRepo(ketNoiLa, ws);'],
  ['createRepo-doi-so-tu-do', 'app/api/z/route.ts', 'const r = createRepo(body.workspaceId);'],
  ['createRepo-doi-so-tu-do', 'app/api/z/route.ts', "const r = createRepo(searchParams.get('ws'));"],
  ['createRepo-doi-so-tu-do', 'app/(dash)/x/page.tsx', 'const r = createRepo(props.ws);'],
  ['createRepo-doi-so-tu-do', 'app/(dash)/x/page.tsx', "const r = createRepo('ws-A');"],
  // Truc co lap thu hai: chi cau noi doc phien duoc che ra `NguoiDungTuPhien`.
  ['kiem-user-id-sai-cho', 'app/api/z/route.ts', 'const n = kiemUserId(body.userId);'],
  ['kiem-user-id-sai-cho', 'app/(dash)/x/actions.ts', 'const n = kiemUserId(form.get("uid"));'],
  ['kiem-user-id-sai-cho', 'lib/studio/y.ts', 'const n = kiemUserId(idBatKy);'],
  ['kiem-user-id-sai-cho', 'lib/auth/current-workspace.ts', 'const n = kiemUserId(userId);'],
];

for (const [quyTac, duongDan, ma] of CHAN) {
  test(`chan duoc [${quyTac}] ${ma.replace(/\n/g, ' ')}`, () => {
    const viPham = quetNoiDung(duongDan, ma);
    assert.ok(
      viPham.some((v) => v.quyTac === quyTac),
      `khong bat duoc. Ket qua: ${JSON.stringify(viPham)}`,
    );
  });
}

const CHO_QUA = [
  // Ngoai le duy nhat: Auth.js bat buoc DrizzleAdapter(db).
  ['auth.ts', "import { db } from '@/db/client';\nexport const { handlers } = NextAuth({});"],
  // Chinh tang truy cap.
  ['lib/data-access/index.ts', "import { db } from '@/db/client';\nexport const r = taoRepo(db, 'x');"],
  ['db/client.ts', "import { Pool } from 'pg';\nexport const db = drizzle(new Pool({}));"],
  // Tien trinh nen.
  ['workers/model/index.ts', "import { createSystemRepo } from '@/lib/data-access/system-repo';"],
  ['lib/queue/claim.ts', 'const { dbToanHeThong } = createSystemRepo();'],
  // Dang goi hop le trong app/.
  ['app/api/z/route.ts', 'const r = createRepo(await workspaceHienTai());'],
  [
    'app/(dash)/x/page.tsx',
    'const workspaceId = await workspaceHienTai();\nconst r = createRepo(workspaceId);',
  ],
  // Chuoi trong chu thich khong duoc lam test bao dong gia.
  ['app/(dash)/x/page.tsx', "// import { db } from '@/db/client'\nexport const a = 1;"],
  ['app/(dash)/x/page.tsx', "/* new Pool() va drizzle() chi duoc o db/client.ts */\nexport const a = 1;"],
  // Duong dan chua chu `db` nhung khong phai be ket noi.
  ['lib/y/z.ts', "import { x } from '@/db/schema/index';"],
  // Cau noi doc phien: cho duy nhat duoc goi `kiemUserId`.
  ['lib/auth/nguoi-dung-tu-phien.ts', 'const n = kiemUserId(userId);'],
  // Tang truy cap tu dinh nghia va dung `kiemUserId`.
  ['lib/data-access/guard.ts', 'export function kiemUserId(v) { return { userId: v }; }'],
  // Dung `nguoiDungHienTai()` trong app/ la dang hop le, khong dinh luat H.
  [
    'app/(dash)/x/actions.ts',
    'const nguoi = await nguoiDungHienTai();\nawait repo.theoDoiCuaToi.bat(nguoi, id);',
  ],
];

for (const [duongDan, ma] of CHO_QUA) {
  test(`cho qua: ${duongDan} :: ${ma.replace(/\n/g, ' ').slice(0, 60)}`, () => {
    const viPham = quetNoiDung(duongDan, ma);
    assert.deepEqual(viPham, [], `bao dong gia: ${JSON.stringify(viPham)}`);
  });
}
