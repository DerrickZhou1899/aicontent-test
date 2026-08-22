'use strict';

/**
 * Hang doi: chan trung o tang CSDL, lay viec bang FOR UPDATE SKIP LOCKED,
 * tha khoa viec treo, gian cach thu lai.
 */

const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');

const { dayViec, sinhKhoaChongTrung } = require('../lib/queue/enqueue');
const {
  GIAN_CACH_MS,
  SO_LAN_CHAY_TOI_DA,
  ghiNhanLoi,
  layViec,
  quyetDinhThuLai,
  thaKhoaViecTreo,
} = require('../lib/queue/claim');
const { beTest, taoKhongGianTam } = require('./tro-giup-db');

describe('hang doi jobs', () => {
  let be;
  let khongGian;
  /** Ghim moi lan lay viec vao khong gian rieng cua tep test nay: `node --test`
   *  chay cac tep song song tren cung mot co so du lieu, khong ghim thi hai tep
   *  cuop viec cua nhau va bo test hong ngat quang. */
  let workspaceId;

  before(async () => {
    be = beTest();
    khongGian = await taoKhongGianTam(be, 'queue');
    workspaceId = khongGian.workspaceId;
  });

  after(async () => {
    if (khongGian) await khongGian.don();
    if (be) await be.end();
  });

  it('cung khoa chong trung -> viec thu hai bi chan o tang CSDL', async () => {
    const khoa = sinhKhoaChongTrung(khongGian.workspaceId, 'sinh-bai', { a: 1 });

    const lan1 = await dayViec(be, {
      workspaceId: khongGian.workspaceId,
      loaiViec: 'sinh-bai',
      duLieuVao: { a: 1 },
      khoaChongTrung: khoa,
    });
    const lan2 = await dayViec(be, {
      workspaceId: khongGian.workspaceId,
      loaiViec: 'sinh-bai',
      duLieuVao: { a: 1 },
      khoaChongTrung: khoa,
    });

    assert.equal(lan1.moi, true);
    assert.equal(lan2.moi, false, 'lan day thu hai phai bi gop vao viec cu');
    assert.equal(lan1.jobId, lan2.jobId);

    const dem = await be.query('SELECT count(*)::int AS n FROM jobs WHERE idempotency_key = $1', [khoa]);
    assert.equal(dem.rows[0].n, 1);

    // Chen thang, khong qua lop ma nguon: phai vo vao rang buoc duy nhat 23505.
    await assert.rejects(
      () =>
        be.query(
          `INSERT INTO jobs (workspace_id, loai_viec, idempotency_key)
           VALUES ($1, 'sinh-bai', $2)`,
          [khongGian.workspaceId, khoa],
        ),
      (loi) => {
        assert.equal(loi.code, '23505');
        assert.match(loi.constraint || '', /idempotency_key/);
        return true;
      },
    );
  });

  it('khoa chong trung khac nhau khi thu tu khoa trong duLieuVao khac nhau thi van bang nhau', () => {
    const a = sinhKhoaChongTrung('w', 'sinh-bai', { x: 1, y: { b: 2, a: 1 } });
    const b = sinhKhoaChongTrung('w', 'sinh-bai', { y: { a: 1, b: 2 }, x: 1 });
    assert.equal(a, b, 'thu tu khoa khong duoc lam doi khoa chong trung');
  });

  it('layViec khoa viec va tang so lan thu; khong con viec thi tra null', async () => {
    const { jobId } = await dayViec(be, {
      workspaceId: khongGian.workspaceId,
      loaiViec: 'boc-tach-ho-so',
      duLieuVao: { t: Date.now() },
      khoaChongTrung: sinhKhoaChongTrung(khongGian.workspaceId, 'boc-tach-ho-so', { t: Date.now() }),
    });

    const viec = await layViec(be, { lockedBy: 'test-1', loaiViec: ['boc-tach-ho-so'], workspaceId });
    assert.equal(viec.id, jobId);
    assert.equal(viec.soLanThu, 1);

    const hang = await be.query('SELECT trang_thai, locked_by, locked_at FROM jobs WHERE id = $1', [jobId]);
    assert.equal(hang.rows[0].trang_thai, 'dang_chay');
    assert.equal(hang.rows[0].locked_by, 'test-1');
    assert.ok(hang.rows[0].locked_at instanceof Date);

    const themNua = await layViec(be, { lockedBy: 'test-2', loaiViec: ['boc-tach-ho-so'], workspaceId });
    assert.equal(themNua, null, 'viec da bi khoa khong duoc phat cho worker thu hai');
  });

  it('viec treo qua 15 phut duoc tha khoa va chay lai', async () => {
    const khoa = sinhKhoaChongTrung(khongGian.workspaceId, 'quet-xu-huong', { treo: true });
    const { jobId } = await dayViec(be, {
      workspaceId: khongGian.workspaceId,
      loaiViec: 'quet-xu-huong',
      duLieuVao: { treo: true },
      khoaChongTrung: khoa,
    });

    await layViec(be, { lockedBy: 'worker-bi-giet', loaiViec: ['quet-xu-huong'], workspaceId });

    // Gia lap worker bi giet 16 phut truoc. Cho that 15 phut la khong test duoc.
    await be.query("UPDATE jobs SET locked_at = now() - interval '16 minutes' WHERE id = $1", [jobId]);

    const daTha = await thaKhoaViecTreo(be, { workspaceId });
    assert.ok(daTha.includes(jobId), 'viec treo phai duoc tha');

    const lai = await layViec(be, { lockedBy: 'worker-moi', loaiViec: ['quet-xu-huong'], workspaceId });
    assert.equal(lai.id, jobId);
    assert.equal(lai.soLanThu, 2, 'so lan thu khong duoc dat lai ve 0');
  });

  it('gian cach thu lai 1 phut -> 5 phut -> 30 phut roi chuyen loi', () => {
    assert.deepEqual(GIAN_CACH_MS, [60_000, 300_000, 1_800_000]);
    assert.deepEqual(quyetDinhThuLai(1), { trangThai: 'cho', doiThemMs: 60_000 });
    assert.deepEqual(quyetDinhThuLai(2), { trangThai: 'cho', doiThemMs: 300_000 });
    assert.deepEqual(quyetDinhThuLai(3), { trangThai: 'cho', doiThemMs: 1_800_000 });
    assert.deepEqual(quyetDinhThuLai(SO_LAN_CHAY_TOI_DA), { trangThai: 'loi', doiThemMs: 0 });
  });

  it('ghiNhanLoi hen chay lai dung gian cach roi chuyen loi o lan cuoi', async () => {
    const khoa = sinhKhoaChongTrung(khongGian.workspaceId, 'cham-chat-luong', { r: 'thu-lai' });
    const { jobId } = await dayViec(be, {
      workspaceId: khongGian.workspaceId,
      loaiViec: 'cham-chat-luong',
      duLieuVao: { r: 'thu-lai' },
      khoaChongTrung: khoa,
    });

    const daThay = [];
    for (let lan = 1; lan <= SO_LAN_CHAY_TOI_DA; lan += 1) {
      // Viec dang hen o tuong lai, ep ve hien tai de lay duoc ngay trong test.
      await be.query('UPDATE jobs SET thoi_diem_chay = now() WHERE id = $1', [jobId]);
      const viec = await layViec(be, { lockedBy: `test-${lan}`, loaiViec: ['cham-chat-luong'], workspaceId });
      assert.equal(viec.soLanThu, lan);
      const quyet = await ghiNhanLoi(be, { jobId, soLanThu: viec.soLanThu, loi: `hong lan ${lan}` });
      daThay.push(quyet.trangThai);
    }

    assert.deepEqual(daThay, ['cho', 'cho', 'cho', 'loi'], '3 lan thu lai roi moi chuyen loi');
    const cuoi = await be.query('SELECT trang_thai, so_lan_thu, loi FROM jobs WHERE id = $1', [jobId]);
    assert.equal(cuoi.rows[0].trang_thai, 'loi');
    assert.equal(cuoi.rows[0].so_lan_thu, SO_LAN_CHAY_TOI_DA);
    assert.equal(cuoi.rows[0].loi, `hong lan ${SO_LAN_CHAY_TOI_DA}`);
  });

  it('SKIP LOCKED: hai giao dich cung lay viec thi moi ben duoc mot viec khac nhau', async () => {
    const ids = [];
    for (const n of [1, 2]) {
      const duLieu = { song: n, dau: Date.now() };
      const { jobId } = await dayViec(be, {
        workspaceId: khongGian.workspaceId,
        loaiViec: 'sinh-y-tuong',
        duLieuVao: duLieu,
        khoaChongTrung: sinhKhoaChongTrung(khongGian.workspaceId, 'sinh-y-tuong', duLieu),
      });
      ids.push(jobId);
    }

    const a = await be.connect();
    const b = await be.connect();
    try {
      await a.query('BEGIN');
      await b.query('BEGIN');
      const viecA = await layViec(a, { lockedBy: 'song-a', loaiViec: ['sinh-y-tuong'], workspaceId });
      // Neu thieu SKIP LOCKED thi lenh nay dung im cho giao dich A -> test treo.
      const viecB = await layViec(b, { lockedBy: 'song-b', loaiViec: ['sinh-y-tuong'], workspaceId });
      assert.ok(viecA && viecB, 'ca hai giao dich phai lay duoc viec');
      assert.notEqual(viecA.id, viecB.id, 'hai worker khong duoc nhan cung mot viec');
      assert.deepEqual([viecA.id, viecB.id].sort(), [...ids].sort());
      await a.query('COMMIT');
      await b.query('COMMIT');
    } finally {
      a.release();
      b.release();
    }
  });
});
