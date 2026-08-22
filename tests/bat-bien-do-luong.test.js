'use strict';

/**
 * Bon bat bien cua nhom do luong phai do CO SO DU LIEU ep, khong phai do ma
 * ung dung tu giu. Moi truong hop duoi day chay cau lenh SQL THANG, khong di
 * qua `lib/data-access/` — neu chi tang ung dung chan thi mot cho quen la lot.
 *
 * Xem plans/260813-0053-siet-bat-bien-schema-do-luong/plan.md
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { beTest, taoKhongGianTam } = require('./tro-giup-db');

const be = beTest();

/** Chay mot cau lenh, tra ve loi PostgreSQL nem ra (hoac null neu chay lot). */
async function loiCua(sql, thamSo) {
  try {
    await be.query(sql, thamSo);
    return null;
  } catch (loi) {
    return loi;
  }
}

async function dungBoiCanh(nhan) {
  const kg = await taoKhongGianTam(be, nhan);
  const bai = await be.query(
    "INSERT INTO contents (workspace_id, be_mat) VALUES ($1, 'fanpage') RETURNING id",
    [kg.workspaceId],
  );
  const contentId = bai.rows[0].id;
  return { ...kg, contentId };
}

async function themBanChup(workspaceId, contentId, status, moc = 't_24_gio') {
  const kq = await be.query(
    `INSERT INTO metric_snapshots
       (workspace_id, content_id, be_mat, moc, nguon, raw_payload, status)
     VALUES ($1, $2, 'fanpage', $3, 'apify', '{}'::jsonb, $4) RETURNING id`,
    [workspaceId, contentId, moc, status],
  );
  return kq.rows[0].id;
}

test.after(() => be.end());

test('duong di dung: ban chup co_du_lieu cham diem duoc', async () => {
  const bc = await dungBoiCanh('hop-le');
  try {
    const snapshotId = await themBanChup(bc.workspaceId, bc.contentId, 'co_du_lieu');
    const loi = await loiCua(
      `INSERT INTO effectiveness_scores
         (workspace_id, content_id, snapshot_id, snapshot_status, formula_version, diem_thanh_phan)
       VALUES ($1, $2, $3, 'co_du_lieu', 1, '{}'::jsonb)`,
      [bc.workspaceId, bc.contentId, snapshotId],
    );
    assert.equal(loi, null, 'ban chup hop le phai cham diem duoc');
  } finally {
    await bc.don();
  }
});

test('khong cham diem duoc cho ban chup khong_do_duoc', async () => {
  const bc = await dungBoiCanh('khong-do-duoc');
  try {
    const snapshotId = await themBanChup(bc.workspaceId, bc.contentId, 'khong_do_duoc');

    // Khai that trang thai -> CHECK chan.
    const loiThat = await loiCua(
      `INSERT INTO effectiveness_scores
         (workspace_id, content_id, snapshot_id, snapshot_status, formula_version, diem_thanh_phan)
       VALUES ($1, $2, $3, 'khong_do_duoc', 1, '{}'::jsonb)`,
      [bc.workspaceId, bc.contentId, snapshotId],
    );
    assert.ok(loiThat, 'cham diem cho ban khong_do_duoc phai bi chan');
    assert.equal(loiThat.constraint, 'effectiveness_scores_chi_cham_ban_do_duoc');

    // Khai doi thanh 'co_du_lieu' de lach -> khoa ngoai ghep chan.
    const loiLach = await loiCua(
      `INSERT INTO effectiveness_scores
         (workspace_id, content_id, snapshot_id, snapshot_status, formula_version, diem_thanh_phan)
       VALUES ($1, $2, $3, 'co_du_lieu', 1, '{}'::jsonb)`,
      [bc.workspaceId, bc.contentId, snapshotId],
    );
    assert.ok(loiLach, 'khai doi trang thai de lach phai bi chan');
    assert.equal(loiLach.constraint, 'effectiveness_scores_snapshot_fk');
  } finally {
    await bc.don();
  }
});

test('so lieu tho bat bien: khong UPDATE, khong DELETE le duoc', async () => {
  const bc = await dungBoiCanh('bat-bien');
  try {
    const snapshotId = await themBanChup(bc.workspaceId, bc.contentId, 'co_du_lieu');

    const loiSuaTho = await loiCua(
      `UPDATE metric_snapshots SET raw_payload = '{"gia":"mao"}'::jsonb WHERE id = $1`,
      [snapshotId],
    );
    assert.ok(loiSuaTho, 'sua raw_payload phai bi chan');
    assert.match(loiSuaTho.message, /chi ghi them/);

    // Chan ca cot da boc, khong rieng raw_payload.
    const loiSuaSo = await loiCua('UPDATE metric_snapshots SET thich = 999 WHERE id = $1', [
      snapshotId,
    ]);
    assert.ok(loiSuaSo, 'sua so da boc cung phai bi chan');

    const loiXoa = await loiCua('DELETE FROM metric_snapshots WHERE id = $1', [snapshotId]);
    assert.ok(loiXoa, 'xoa le mot ban chup phai bi chan');
    assert.match(loiXoa.message, /chi ghi them/);
  } finally {
    await bc.don();
  }
});

test('doi trang thai ban chup da cham diem thi bi chan', async () => {
  const bc = await dungBoiCanh('doi-trang-thai');
  try {
    const snapshotId = await themBanChup(bc.workspaceId, bc.contentId, 'co_du_lieu');
    await be.query(
      `INSERT INTO effectiveness_scores
         (workspace_id, content_id, snapshot_id, snapshot_status, formula_version, diem_thanh_phan)
       VALUES ($1, $2, $3, 'co_du_lieu', 1, '{}'::jsonb)`,
      [bc.workspaceId, bc.contentId, snapshotId],
    );

    const loi = await loiCua(
      "UPDATE metric_snapshots SET status = 'khong_do_duoc' WHERE id = $1",
      [snapshotId],
    );
    assert.ok(loi, 'khong duoc cham diem xong roi moi doi trang thai');
  } finally {
    await bc.don();
  }
});

test('diem khong bam duoc sang workspace hoac bai khac', async () => {
  const a = await dungBoiCanh('cheo-a');
  const b = await dungBoiCanh('cheo-b');
  try {
    const snapshotA = await themBanChup(a.workspaceId, a.contentId, 'co_du_lieu');

    const loiCheoWorkspace = await loiCua(
      `INSERT INTO effectiveness_scores
         (workspace_id, content_id, snapshot_id, snapshot_status, formula_version, diem_thanh_phan)
       VALUES ($1, $2, $3, 'co_du_lieu', 1, '{}'::jsonb)`,
      [b.workspaceId, a.contentId, snapshotA],
    );
    assert.ok(loiCheoWorkspace, 'diem cua workspace khac phai bi chan');

    const loiCheoBai = await loiCua(
      `INSERT INTO effectiveness_scores
         (workspace_id, content_id, snapshot_id, snapshot_status, formula_version, diem_thanh_phan)
       VALUES ($1, $2, $3, 'co_du_lieu', 1, '{}'::jsonb)`,
      [a.workspaceId, b.contentId, snapshotA],
    );
    assert.ok(loiCheoBai, 'diem gan vao ban chup cua bai khac phai bi chan');
    assert.equal(loiCheoBai.constraint, 'effectiveness_scores_content_fk');

    // Ban chup cung khong duoc tro sang bai cua workspace khac.
    const loiBanChupCheo = await loiCua(
      `INSERT INTO metric_snapshots
         (workspace_id, content_id, be_mat, moc, nguon, raw_payload, status)
       VALUES ($1, $2, 'fanpage', 't_7_ngay', 'apify', '{}'::jsonb, 'co_du_lieu')`,
      [a.workspaceId, b.contentId],
    );
    assert.ok(loiBanChupCheo, 'ban chup tro sang bai cua workspace khac phai bi chan');
  } finally {
    await a.don();
    await b.don();
  }
});

test('be mat ghim luc do, doi be_mat cua bai da co ban chup thi bi chan', async () => {
  const bc = await dungBoiCanh('be-mat');
  try {
    await themBanChup(bc.workspaceId, bc.contentId, 'co_du_lieu');

    const loi = await loiCua("UPDATE contents SET be_mat = 'tiktok' WHERE id = $1", [
      bc.contentId,
    ]);
    assert.ok(loi, 'doi be mat khi da co ban chup phai bi chan');
    assert.equal(loi.constraint, 'metric_snapshots_content_fk');

    // Ban chup khai be mat khac voi bai cung bi chan ngay tu luc ghi.
    const loiLech = await loiCua(
      `INSERT INTO metric_snapshots
         (workspace_id, content_id, be_mat, moc, nguon, raw_payload, status)
       VALUES ($1, $2, 'tiktok', 't_7_ngay', 'apify', '{}'::jsonb, 'co_du_lieu')`,
      [bc.workspaceId, bc.contentId],
    );
    assert.ok(loiLech, 'ban chup khai be mat lech voi bai phai bi chan');
  } finally {
    await bc.don();
  }
});

test('xoa cung mot bai da co ban chup thi bi chan', async () => {
  const bc = await dungBoiCanh('xoa-bai');
  try {
    await themBanChup(bc.workspaceId, bc.contentId, 'co_du_lieu');
    const loi = await loiCua('DELETE FROM contents WHERE id = $1', [bc.contentId]);
    assert.ok(loi, 'xoa cung bai da do luong phai bi chan — luong dung la da_bo');
  } finally {
    await bc.don();
  }
});

/**
 * Doi trong cua bai tren: chan sua lich su KHONG duoc bien thanh chan go mot
 * khach hang. Neu bai nay hong thi moi bo test khac cung hong theo, vi ham don
 * dep dung chung xoa workspace.
 */
test('xoa ca workspace van chay duoc du da co ban chup', async () => {
  const bc = await dungBoiCanh('go-khach-hang');
  await themBanChup(bc.workspaceId, bc.contentId, 'co_du_lieu');

  const loi = await loiCua('DELETE FROM workspaces WHERE id = $1', [bc.workspaceId]);
  assert.equal(loi, null, 'go han mot khach hang phai chay duoc');

  const conLai = await be.query(
    'SELECT count(*)::int AS n FROM metric_snapshots WHERE workspace_id = $1',
    [bc.workspaceId],
  );
  assert.equal(conLai.rows[0].n, 0);

  await be.query('DELETE FROM users WHERE id = $1', [bc.userId]);
});
