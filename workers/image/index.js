'use strict';

const os = require('node:os');

const { taoVongLap, HET_GIO_VIEC_MS } = require('../model/vong-lap');
const { goiGeminiSinhAnh } = require('./gemini');
const { luuAnh } = require('./kho-anh');
const { taoChayViec } = require('./xu-ly-viec');

const LOAI_VIEC_NHAN = ['sinh-anh'];

async function chinh() {
  // Nạp repo trễ để việc import hợp đồng worker không tự mở kết nối CSDL.
  require('tsx/cjs');
  const { createSystemRepo } = require('../../lib/data-access/system-repo.ts');
  const heThong   = createSystemRepo();
  const tenWorker = `${os.hostname()}:${process.pid}:image`;
  const vongLap   = taoVongLap({
    be               : heThong.pool,
    chayViec         : taoChayViec({
      repoTheoWorkspace : heThong.repoTheoWorkspace,
      goiSinhAnh        : goiGeminiSinhAnh,
      luu               : luuAnh,
    }),
    tenWorker,
    gioiHanDongThoi : Number(process.env.WORKER_ANH_DONG_THOI || 1),
    hetGioViecMs    : Number(process.env.WORKER_ANH_HET_GIO_MS || HET_GIO_VIEC_MS),
    loaiViec        : LOAI_VIEC_NHAN,
  });

  let dangDong = false;
  for (const tinHieu of ['SIGINT', 'SIGTERM']) {
    process.on(tinHieu, () => {
      if (dangDong) return;
      dangDong = true;
      vongLap.dung().then(() => heThong.pool.end()).finally(() => process.exit(0));
    });
  }

  console.log(`[worker-image] ${tenWorker} nhận: ${LOAI_VIEC_NHAN.join(', ')}`);
  await vongLap.batDau();
}

if (require.main === module) {
  chinh().catch((loi) => {
    console.error('[worker-image] chết:', loi);
    process.exit(1);
  });
}

module.exports = { LOAI_VIEC_NHAN, chinh };
