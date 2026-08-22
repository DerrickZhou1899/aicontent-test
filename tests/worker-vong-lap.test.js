'use strict';

/**
 * Vong lap worker: gioi han dong thoi, tran thoi gian, ket so `model_runs` +
 * `cost_log`.
 *
 * Bo chay duoc gia lap. Muc tieu o day la hanh vi cua hang doi, khong phai chat
 * luong mo hinh — chay CLI that cho tung tinh huong nay ton hang chuc phut va
 * quota thue bao. Duong chay that co bo test rieng o model-runner-sandbox.test.js.
 */

const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');

const { dayViec, sinhKhoaChongTrung } = require('../lib/queue/enqueue');
const { ghiNhatKyChay, tinhChiPhiUocTinh } = require('../lib/model-runner/ghi-nhat-ky');
const { taoVongLap } = require('../workers/model/vong-lap');
const { beTest, taoKhongGianTam } = require('./tro-giup-db');

const nghi = (ms) => new Promise((tiep) => setTimeout(tiep, ms));

describe('vong lap worker-model', () => {
  let be;
  let khongGian;

  before(async () => {
    be = beTest();
    khongGian = await taoKhongGianTam(be, 'worker');
  });

  after(async () => {
    if (khongGian) await khongGian.don();
    if (be) await be.end();
  });

  async function dayNViec(soLuong, loaiViec) {
    const ids = [];
    for (let i = 0; i < soLuong; i += 1) {
      const duLieu = { chiSo: i, dau: `${loaiViec}-${Date.now()}` };
      const { jobId } = await dayViec(be, {
        workspaceId: khongGian.workspaceId,
        loaiViec,
        duLieuVao: duLieu,
        khoaChongTrung: sinhKhoaChongTrung(khongGian.workspaceId, loaiViec, duLieu),
      });
      ids.push(jobId);
    }
    return ids;
  }

  it('5 viec cung luc -> chi 2 chay dong thoi, 3 xep hang', async () => {
    const ids = await dayNViec(5, 'sinh-bai');

    let dangChay = 0;
    let dinhCaoDongThoi = 0;
    const daChay = [];

    const vongLap = taoVongLap({
      be,
      tenWorker: 'test-dong-thoi',
      workspaceId: khongGian.workspaceId,
      gioiHanDongThoi: 2,
      loaiViec: ['sinh-bai'],
      ghiNhatKy: () => {},
      chayViec: async (viec) => {
        dangChay += 1;
        dinhCaoDongThoi = Math.max(dinhCaoDongThoi, dangChay);
        await nghi(120);
        dangChay -= 1;
        daChay.push(viec.id);
        return { thanhCong: true, ketQua: { ok: true } };
      },
    });

    const hanChot = Date.now() + 20_000;
    while (daChay.length < ids.length && Date.now() < hanChot) {
      await vongLap.motVong();
      assert.ok(
        vongLap.soDangChay() <= 2,
        `vuot gioi han dong thoi: ${vongLap.soDangChay()}`,
      );
      await nghi(20);
    }
    await vongLap.dung();

    assert.equal(daChay.length, 5, 'ca 5 viec phai chay xong');
    assert.equal(dinhCaoDongThoi, 2, `dinh cao dong thoi phai la 2, do duoc ${dinhCaoDongThoi}`);

    const xong = await be.query(
      "SELECT count(*)::int AS n FROM jobs WHERE id = ANY($1) AND trang_thai = 'xong'",
      [ids],
    );
    assert.equal(xong.rows[0].n, 5);
  });

  it('viec chay qua tran thoi gian -> bi cat, khong treo hang doi', async () => {
    const [jobId] = await dayNViec(1, 'sinh-kich-ban');

    const vongLap = taoVongLap({
      be,
      tenWorker: 'test-tran-gio',
      workspaceId: khongGian.workspaceId,
      gioiHanDongThoi: 1,
      // Tran that o san xuat la 300000ms; ha xuong de test chay duoc trong vai
      // tram mili giay. Co che bi kiem la Promise.race, khong phai con so.
      hetGioViecMs: 100,
      loaiViec: ['sinh-kich-ban'],
      ghiNhatKy: () => {},
      chayViec: async () => {
        await nghi(3_000);
        return { thanhCong: true, ketQua: {} };
      },
    });

    await vongLap.motVong();
    // Cho vuot tran mot chut de vong lap kip ket so viec.
    await nghi(400);

    const hang = await be.query('SELECT trang_thai, so_lan_thu, loi FROM jobs WHERE id = $1', [jobId]);
    assert.equal(hang.rows[0].trang_thai, 'cho', 'con luot thu lai thi ve lai hang doi');
    assert.equal(hang.rows[0].so_lan_thu, 1);
    assert.match(hang.rows[0].loi, /chay qua 100ms, bi cat/);

    const ketDangChay = await be.query(
      "SELECT count(*)::int AS n FROM jobs WHERE workspace_id = $1 AND trang_thai = 'dang_chay'",
      [khongGian.workspaceId],
    );
    assert.equal(ketDangChay.rows[0].n, 0, 'khong duoc de viec nao ket o dang_chay');

    await vongLap.dung();
  });

  it('viec hong lien tuc -> thu lai 3 lan roi chuyen loi', async () => {
    const [jobId] = await dayNViec(1, 'phan-loai-binh-luan');
    let soLanGoi = 0;

    const vongLap = taoVongLap({
      be,
      tenWorker: 'test-thu-lai',
      workspaceId: khongGian.workspaceId,
      gioiHanDongThoi: 1,
      loaiViec: ['phan-loai-binh-luan'],
      ghiNhatKy: () => {},
      chayViec: async () => {
        soLanGoi += 1;
        return { thanhCong: false, loi: 'gia lap hong' };
      },
    });

    for (let lan = 0; lan < 4; lan += 1) {
      // Gian cach that la 1/5/30 phut; ep `thoi_diem_chay` ve hien tai de khong
      // phai cho 36 phut trong bo test.
      await be.query('UPDATE jobs SET thoi_diem_chay = now() WHERE id = $1', [jobId]);
      await vongLap.motVong();
      // Khong goi dung() o day: dung() la mot chieu (tien trinh sap thoat), goi
      // no roi motVong() se khong nhan viec nua.
      while (vongLap.soDangChay() > 0) await nghi(10);
    }

    assert.equal(soLanGoi, 4, '1 lan dau + 3 lan thu lai');
    const hang = await be.query('SELECT trang_thai, so_lan_thu FROM jobs WHERE id = $1', [jobId]);
    assert.equal(hang.rows[0].trang_thai, 'loi');
    assert.equal(hang.rows[0].so_lan_thu, 4);
  });

  it('moi lan chay sinh dung 1 dong model_runs + 1 dong cost_log, co nhan mo hinh', async () => {
    const [jobId] = await dayNViec(1, 'boc-tach-ho-so');

    const { modelRunId, costLogId } = await ghiNhatKyChay(be, {
      workspaceId: khongGian.workspaceId,
      jobId,
      nhiemVu: 'boc-tach-ho-so',
      moHinh: 'claude-cli',
      doDaiVao: 1500,
      doDaiRa: 2500,
      thoiGianChayMs: 4321,
      thanhCong: true,
    });

    const chay = await be.query('SELECT * FROM model_runs WHERE job_id = $1', [jobId]);
    assert.equal(chay.rowCount, 1);
    assert.equal(chay.rows[0].id, modelRunId);
    assert.equal(chay.rows[0].mo_hinh, 'claude-cli', 'phai co nhan mo hinh');
    assert.equal(chay.rows[0].nhiem_vu, 'boc-tach-ho-so');
    assert.equal(chay.rows[0].do_dai_vao, 1500);
    assert.equal(chay.rows[0].do_dai_ra, 2500);
    assert.equal(chay.rows[0].thanh_cong, true);

    const so = await be.query('SELECT * FROM cost_log WHERE model_run_id = $1', [modelRunId]);
    assert.equal(so.rowCount, 1);
    assert.equal(so.rows[0].id, costLogId);
    assert.equal(so.rows[0].loai_chi_phi, 'goi-mo-hinh');
    assert.equal(so.rows[0].don_vi_tien, 'VND');
    const mong = tinhChiPhiUocTinh(1500, 2500, 'claude-cli');
    assert.equal(Number(so.rows[0].so_luong), mong.soLuong);
    assert.equal(Number(so.rows[0].chi_phi_uoc_tinh), mong.chiPhiUocTinh);
  });

  it('lan chay that bai van ghi nhat ky chi phi', async () => {
    const { modelRunId } = await ghiNhatKyChay(be, {
      workspaceId: khongGian.workspaceId,
      nhiemVu: 'cham-chat-luong',
      moHinh: 'codex-cli',
      doDaiVao: 800,
      doDaiRa: 0,
      thoiGianChayMs: 999,
      thanhCong: false,
      loi: 'CLI thoat voi ma 3',
    });

    const chay = await be.query('SELECT thanh_cong, loi FROM model_runs WHERE id = $1', [modelRunId]);
    assert.equal(chay.rows[0].thanh_cong, false);
    assert.equal(chay.rows[0].loi, 'CLI thoat voi ma 3');

    const so = await be.query('SELECT count(*)::int AS n FROM cost_log WHERE model_run_id = $1', [modelRunId]);
    assert.equal(so.rows[0].n, 1, 'that bai van ton thoi gian may va quota -> van phai ghi');
  });
});
