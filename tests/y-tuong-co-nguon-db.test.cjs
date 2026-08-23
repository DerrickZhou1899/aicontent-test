'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { drizzle } = require('drizzle-orm/node-postgres');

const schema = require('../db/schema/index.ts');
const { ideasRepo } = require('../lib/data-access/ideas.ts');
const { beTest, taoKhongGianTam } = require('./tro-giup-db.js');

test('idea chi tiet tra ve ten lien ket, nguon va an ID workspace khac', async () => {
  const be     = beTest();
  const ketNoi = drizzle(be, { schema });
  const a      = await taoKhongGianTam(be, 'idea-nguon-a');
  const b      = await taoKhongGianTam(be, 'idea-nguon-b');

  try {
    const [truCot] = await ketNoi
      .insert(schema.contentPillars)
      .values({ workspaceId: a.workspaceId, ten: 'Giáo dục' })
      .returning();
    const [chanDung] = await ketNoi
      .insert(schema.personas)
      .values({ workspaceId: a.workspaceId, ten: 'Chủ shop mới' })
      .returning();
    const [tinHieu] = await ketNoi
      .insert(schema.trendSignals)
      .values({
        workspaceId : a.workspaceId,
        nguon       : 'kiem-thu',
        tieuDe      : 'Bài nguồn đáng xem',
        lienKet     : 'https://vi-du.test/bai-nguon',
      })
      .returning();
    const [yTuongA] = await ketNoi
      .insert(schema.ideas)
      .values({
        workspaceId   : a.workspaceId,
        beMat         : 'fanpage',
        tieuDe        : 'Tiêu đề ý tưởng',
        pillarId      : truCot.id,
        personaId     : chanDung.id,
        trendSignalId : tinHieu.id,
      })
      .returning();
    const [yTuongB] = await ketNoi
      .insert(schema.ideas)
      .values({ workspaceId: b.workspaceId, beMat: 'tiktok', tieuDe: 'Ý tưởng riêng B' })
      .returning();

    const repoA    = ideasRepo(ketNoi, a.workspaceId);
    const danhSach = await repoA.listChiTiet();
    const chiTietA = await repoA.layChiTietTheoId(yTuongA.id);

    assert.equal(danhSach.length, 1);
    assert.equal(chiTietA.tieuDe, 'Tiêu đề ý tưởng');
    assert.equal(chiTietA.tenTruCot, 'Giáo dục');
    assert.equal(chiTietA.tenChanDung, 'Chủ shop mới');
    assert.equal(chiTietA.tieuDeNguon, 'Bài nguồn đáng xem');
    assert.equal(chiTietA.lienKetNguon, 'https://vi-du.test/bai-nguon');
    assert.equal(await repoA.layChiTietTheoId(yTuongB.id), null);
  } finally {
    await a.don();
    await b.don();
    await be.end();
  }
});
