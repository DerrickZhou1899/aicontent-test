'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { drizzle } = require('drizzle-orm/node-postgres');

const schema = require('../db/schema/index.ts');
const { jobsRepo } = require('../lib/data-access/jobs.ts');
const { crudTheoWorkspace } = require('../lib/data-access/crud-theo-workspace.ts');
const { contentsRepo } = require('../lib/data-access/contents.ts');
const { tinHieuXuHuongRepo } = require('../lib/data-access/tin-hieu-xu-huong.ts');
const { kiemUserId } = require('../lib/data-access/guard.ts');

function ketNoiGhiSql() {
  const nhatKy = [];
  const ketNoi = drizzle({ query: async () => ({ rows: [], rowCount: 0, fields: [] }) }, {
    schema,
    logger : { logQuery: (cau, thamSo) => nhatKy.push({ cau, thamSo }) },
  });
  return { ketNoi, nhatKy };
}

test('jobs claim uses one workspace-scoped completed-job compare-and-set update', async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();
  const repo = jobsRepo(ketNoi, 'workspace-a');
  assert.equal(typeof repo.nhanQuyenLuuYTuong, 'function');

  await repo.nhanQuyenLuuYTuong('job-a');

  assert.equal(nhatKy.length, 1);
  assert.match(nhatKy[0].cau, /^update "jobs" set /);
  assert.match(nhatKy[0].cau, /jsonb_set/);
  assert.match(nhatKy[0].cau, /"jobs"\."workspace_id" = \$\d+/);
  assert.match(nhatKy[0].cau, /"jobs"\."id" = \$\d+/);
  assert.match(nhatKy[0].cau, /"jobs"\."trang_thai" = \$\d+/);
  assert.match(nhatKy[0].cau, /_studioDaLuuYTuong/);
  assert.deepEqual(nhatKy[0].thamSo, ['workspace-a', 'job-a', 'xong']);
});

test('service input lists use newest-first stable ID tie breakers', async () => {
  const { ketNoi, nhatKy } = ketNoiGhiSql();

  await crudTheoWorkspace(ketNoi, 'workspace-a', schema.contentPillars).list();
  await contentsRepo(ketNoi, 'workspace-a').list();
  await tinHieuXuHuongRepo(ketNoi, 'workspace-a').theoNguoiDung(kiemUserId('user-a'), 10);

  assert.match(nhatKy[0].cau, /order by "content_pillars"\."ngay_tao" desc, "content_pillars"\."id" desc/);
  assert.match(nhatKy[1].cau, /order by "contents"\."ngay_tao" desc, "contents"\."id" desc/);
  assert.match(nhatKy[2].cau, /order by "trend_signals"\."thoi_diem" desc, "trend_signals"\."id" desc/);
});
