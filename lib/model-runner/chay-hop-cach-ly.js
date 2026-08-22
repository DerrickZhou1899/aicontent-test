'use strict';

/**
 * Goi `docker/worker-model/run-in-sandbox.sh` — mot cua duy nhat de chay CLI.
 *
 * KHONG tu go `docker run` o day. Bo co cach ly nam o `sandbox-flags.sh` va
 * dung chung voi `test-isolation.sh`; go lai tay la som muon hai ben lech nhau,
 * luc do bo test cach ly van xanh trong khi viec that chay ho henh.
 *
 * Ma thoat cua run-task.sh (hop dong da chot o Phase 4):
 *   0 xong · 2 input sai (KHONG thu lai) · 3 CLI loi (thu lai duoc)
 *   4 qua gio (thu lai duoc) · 5 khong ghi duoc ket qua
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const THU_MUC_GOC = path.resolve(__dirname, '..', '..');
const DUONG_DAN_SCRIPT = path.join(THU_MUC_GOC, 'docker', 'worker-model', 'run-in-sandbox.sh');

/** Tran thoi gian cho viec goi mo hinh (Phu luc B muc 6.2). */
const HET_GIO_MS = 300_000;

/**
 * Do host cho docker them so voi tran cua container. Container tu cat o
 * SANDBOX_TIMEOUT; do nay chi de phong chinh `docker run` treo (keo anh, daemon
 * ban) — khong co no thi mot lan docker treo lam ket ca mot suat dong thoi.
 */
const DU_HOST_MS = 30_000;

const MA_THOAT = {
  XONG: 0,
  INPUT_SAI: 2,
  CLI_LOI: 3,
  QUA_GIO: 4,
  KHONG_GHI_DUOC: 5,
};

/**
 * @param {{
 *   nhiemVu: string,
 *   loiNhac: string,
 *   duLieuVao: Record<string, unknown>,
 *   moHinhHop: 'claude' | 'codex',
 *   hetGioMs?: number,
 * }} thamSo
 * @returns {Promise<{
 *   maThoat: number, ok: boolean, ketQuaTho: string, thoiGianChayMs: number,
 *   soChuoiDaChe: number, canhBao: string[], nhatKy: string,
 * }>}
 */
async function chayTrongHopCachLy(thamSo) {
  const { nhiemVu, loiNhac, duLieuVao, moHinhHop, hetGioMs = HET_GIO_MS } = thamSo;

  const thuMucTam = await fs.mkdtemp(path.join(os.tmpdir(), 'aicontent-goi-'));
  try {
    const duongDanVao = path.join(thuMucTam, 'input.json');
    const duongDanRa = path.join(thuMucTam, 'output.json');

    // run-task.sh doc `duLieuVao` nhu MOT CHUOI roi boc trong khoi co nhan. Doi
    // sang chuoi o day chu khong o trong container: doi tuong long nhau ma de
    // container tu dien giai la them mot cho co the hieu nham.
    await fs.writeFile(
      duongDanVao,
      JSON.stringify({
        nhiemVu,
        loiNhac,
        moHinh: moHinhHop,
        duLieuVao: JSON.stringify(duLieuVao ?? {}, null, 2),
      }),
      { mode: 0o600 },
    );

    const batDau = Date.now();
    const chay = await goiScript(duongDanVao, duongDanRa, hetGioMs);
    const thoiGianChayMs = Date.now() - batDau;

    let ketQua = null;
    try {
      ketQua = JSON.parse(await fs.readFile(duongDanRa, 'utf8'));
    } catch {
      ketQua = null; // container chet truoc khi kip ghi
    }

    return {
      maThoat: chay.maThoat,
      ok: chay.maThoat === MA_THOAT.XONG && ketQua != null && ketQua.ok === true,
      ketQuaTho: ketQua ? String(ketQua.ketQua ?? '') : '',
      // Uu tien so lieu container do duoc; chi dung do o host khi container
      // khong kip ghi ket qua.
      thoiGianChayMs: ketQua ? Number(ketQua.thoiGianChayMs) || thoiGianChayMs : thoiGianChayMs,
      soChuoiDaChe: ketQua ? Number(ketQua.soChuoiDaChe) || 0 : 0,
      canhBao: ketQua && Array.isArray(ketQua.canhBao) ? ketQua.canhBao : [],
      nhatKy: chay.nhatKy,
    };
  } finally {
    // Xoa thu muc tam du chay kieu gi: input.json chua ho so thuong hieu, con
    // output.json chua ket qua chua kip loc lan hai.
    await fs.rm(thuMucTam, { recursive: true, force: true });
  }
}

function goiScript(duongDanVao, duongDanRa, hetGioMs) {
  return new Promise((thanhCong, thatBai) => {
    const tienTrinh = spawn('bash', [DUONG_DAN_SCRIPT, duongDanVao, duongDanRa], {
      env: {
        ...process.env,
        // CLI can goi mang de lam viec; hop cach ly van chan /www, chan docker
        // socket, chan ghi ra ngoai /work.
        SANDBOX_MANG: process.env.SANDBOX_MANG || 'bridge',
        SANDBOX_THE_DANG_NHAP: process.env.SANDBOX_THE_DANG_NHAP || '1',
        SANDBOX_TIMEOUT: String(Math.ceil(hetGioMs / 1000)),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let nhatKy = '';
    const gomNhatKy = (khoi) => {
      // Giu 16KB cuoi: nhat ky chi de con nguoi doc khi go loi, khong luu vao
      // co so du lieu, va CLI co the in rat dai.
      nhatKy = (nhatKy + khoi.toString()).slice(-16_384);
    };
    tienTrinh.stdout.on('data', gomNhatKy);
    tienTrinh.stderr.on('data', gomNhatKy);

    const dongHo = setTimeout(() => {
      tienTrinh.kill('SIGKILL');
    }, hetGioMs + DU_HOST_MS);

    tienTrinh.on('error', (loi) => {
      clearTimeout(dongHo);
      thatBai(loi);
    });

    tienTrinh.on('close', (ma, tinHieu) => {
      clearTimeout(dongHo);
      thanhCong({
        maThoat: tinHieu ? MA_THOAT.QUA_GIO : (ma ?? MA_THOAT.KHONG_GHI_DUOC),
        nhatKy,
      });
    });
  });
}

module.exports = { DU_HOST_MS, HET_GIO_MS, MA_THOAT, chayTrongHopCachLy };
