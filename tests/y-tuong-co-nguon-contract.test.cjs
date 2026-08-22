'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs   = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const { drizzle } = require('drizzle-orm/node-postgres');

const schema = require('../db/schema/index.ts');
const { ideasRepo } = require('../lib/data-access/ideas.ts');

function ketNoiGhiSql() {
  const nhatKy   = [];
  const khachGia = { query: async () => ({ rows: [], rowCount: 0, fields: [] }) };
  const ketNoi   = drizzle(khachGia, {
    schema,
    logger : { logQuery: (cau, thamSo) => nhatKy.push({ cau, thamSo }) },
  });
  return { ketNoi, nhatKy };
}

test('ideas co tieu de bat buoc trong schema', () => {
  assert.ok(schema.ideas.tieuDe, 'ideas.tieuDe phai ton tai');
  assert.equal(schema.ideas.tieuDe.notNull, true);
});

test('listChiTiet chieu ten lien ket va nguon trong pham vi workspace', async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();

  await ideasRepo(ketNoi, 'ws-A').listChiTiet();

  assert.equal(nhatKy.length, 1);
  const { cau, thamSo } = nhatKy[0];
  assert.match(cau, /left join "content_pillars"/);
  assert.match(cau, /left join "personas"/);
  assert.match(cau, /left join "trend_signals"/);
  assert.match(cau, /"ideas"\."workspace_id" = \$\d+/);
  assert.match(cau, /"content_pillars"\."workspace_id" = \$\d+/);
  assert.match(cau, /"personas"\."workspace_id" = \$\d+/);
  assert.match(cau, /"trend_signals"\."workspace_id" = \$\d+/);
  assert.match(cau, /order by "ideas"\."ngay_tao" desc, "ideas"\."id" desc/);
  assert.ok(cau.includes('"tieu_de"'), 'thieu tieu de y tuong/nguon trong projection');
  assert.ok(cau.includes('"lien_ket"'), 'thieu lien ket nguon trong projection');
  assert.deepEqual(thamSo, ['ws-A', 'ws-A', 'ws-A', 'ws-A']);
});

test('layChiTietTheoId loc ca workspace va ID y tuong', async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();
  const id = randomUUID();

  await ideasRepo(ketNoi, 'ws-A').layChiTietTheoId(id);

  assert.equal(nhatKy.length, 1);
  const { cau, thamSo } = nhatKy[0];
  assert.match(cau, /"ideas"\."workspace_id" = \$\d+/);
  assert.match(cau, /"ideas"\."id" = \$\d+/);
  assert.deepEqual(thamSo, ['ws-A', 'ws-A', 'ws-A', 'ws-A', id, 1]);
});

test('migration tieu de backfill du lieu cu truoc khi bat buoc', () => {
  const duongDan = path.join(__dirname, '../db/migrations/0009_add_idea_title.sql');
  const sql      = fs.readFileSync(duongDan, 'utf8');
  const themCot  = 'ALTER TABLE "ideas" ADD COLUMN "tieu_de" text;';
  const backfill = "UPDATE \"ideas\" SET \"tieu_de\" = COALESCE(\"cau_mo_dau\", \"goc_tiep_can\", 'Ý tưởng nội dung');";
  const batBuoc  = 'ALTER TABLE "ideas" ALTER COLUMN "tieu_de" SET NOT NULL;';

  assert.ok(sql.includes(themCot));
  assert.ok(sql.includes(backfill));
  assert.ok(sql.includes(batBuoc));
  assert.ok(sql.indexOf(themCot) < sql.indexOf(backfill));
  assert.ok(sql.indexOf(backfill) < sql.indexOf(batBuoc));
});

test('rollback tieu de chi bo cot schema', () => {
  const duongDan = path.join(__dirname, '../db/rollback/0009_add_idea_title.down.sql');
  const sql      = fs.readFileSync(duongDan, 'utf8').trim();

  assert.equal(sql, 'ALTER TABLE "ideas" DROP COLUMN "tieu_de";');
});
