'use strict';

/**
 * Keo bai cua cac kenh dang theo doi, chay theo lich tu cron.
 *
 * NAM O `workers/` chu khong `scripts/` vi day la mot TIEN TRINH NEN: no dung
 * `createSystemRepo()` (vai tro database bo qua pham vi workspace), ma bo quet
 * `tests/quet-tang-truy-cap.cjs` chi cho phep dieu do trong `workers/**` va
 * `lib/queue/**`. Vo boc cho cron van o `scripts/keo-kenh-theo-doi.sh`, cung cho
 * voi `auto-deploy.sh`.
 *
 * ============ VI SAO KHONG DI QUA HANG DOI `jobs` ============
 * Ban ke hoach ban dau dinh day viec `quet-xu-huong` vao hang doi va dung mot
 * worker thu hai. Doc ma that thi hong o hai cho:
 *
 *  1. VA CHAM LOAI VIEC. `worker-model` sinh danh sach loai viec no nhan tu
 *     `Object.values(LOAI_VIEC_THEO_NHIEM_VU)`, ma bang do da co
 *     `cham-diem-lien-quan -> quet-xu-huong`. Nghia la worker-model DA nhan
 *     `quet-xu-huong` roi. Day them viec keo vao cung loai do thi hai worker
 *     tranh nhau, va ben giành duoc lai la ben khong biet lam.
 *
 *  2. THU LAI LA CO HAI, KHONG PHAI CO LOI. Hang doi thu lai toi 3 lan. Tien
 *     Apify mat ngay khi actor chay xong, khong hoan duoc — thu lai chi tra
 *     tien lan hai cho cung nhom kenh.
 *
 * Bo hang doi thi mat gi? Ba thu, va ca ba deu da co cho khac lo:
 *   - Chong chay trung  -> `flock` trong `keo-kenh-theo-doi.sh`
 *   - Chong keo trung   -> `lan_keo_cuoi` + `canKeo(hanGio)`, dung o muc TUNG
 *                          KENH chu khong phai muc ca luot, tot hon hang doi
 *   - Chong qua tai     -> mot tien trinh, chay tuan tu tung workspace
 *
 * Boc cach ke thi VAN di qua hang doi: no la mot luot goi mo hinh that, va
 * `worker-model` da nhan dung loai viec do san.
 *
 * Chay:  node -r dotenv/config workers/keo/index.js
 *        (cron goi qua scripts/keo-kenh-theo-doi.sh de co flock)
 */

require('tsx/cjs');

const { createSystemRepo } = require('../../lib/data-access/system-repo.ts');
const { keoKenhDenHan } = require('../../lib/keo-bai/keo-kenh-theo-doi.ts');
const { bocCongThucChoBaiMoi } = require('../../lib/studio/boc-cong-thuc.ts');

/** Mac dinh ~2 lan mot tuan. Doi bang bien moi truong, khong sua ma. */
function hanGio() {
  const so = Number(process.env.XU_HUONG_HAN_GIO);
  return Number.isFinite(so) && so > 0 ? so : 84;
}

function ghi(thongDiep) {
  process.stdout.write(`[keo-kenh] ${new Date().toISOString()} ${thongDiep}\n`);
}

async function chay() {
  const heThong = createSystemRepo();

  // Moi workspace mot vong, TUAN TU: chay song song la nhieu luot Apify cung
  // luc, ma cong chan chi phi doc han muc TRUOC khi chay nen se cho qua het.
  const { rows } = await heThong.pool.query('SELECT id FROM workspaces ORDER BY ngay_tao');
  ghi(`bat dau, ${rows.length} workspace, han ${hanGio()} gio`);

  let tongBaiMoi = 0;
  let tongChiPhi = 0;

  for (const { id } of rows) {
    let ket;
    try {
      ket = await keoKenhDenHan(id, hanGio());
    } catch (loi) {
      // Mot workspace hong khong duoc lam dung ca luot cua cac workspace sau.
      ghi(`ws=${id} HONG: ${loi.message}`);
      continue;
    }

    for (const k of ket) {
      if (k.boLuot) {
        ghi(`ws=${id} BO LUOT: ${k.lyDoBoLuot}`);
        continue;
      }
      tongBaiMoi += k.soBaiMoi;
      tongChiPhi += k.chiPhiUsd ?? 0;
      ghi(
        `ws=${id} keo ${k.soKenhKeo} kenh, ${k.soBaiMoi} bai moi, ` +
          `that ${(k.chiPhiUsd ?? 0).toFixed(4)} USD (uoc ${k.uocTinhUsd.toFixed(4)})`,
      );
      for (const c of k.canhBao) ghi(`ws=${id} canh bao: ${c}`);
    }

    // Boc ngay sau khi keo: nut "sinh y" o man de xuat khong phai cho.
    if (ket.some((k) => k.soBaiMoi > 0)) {
      try {
        const boc = await bocCongThucChoBaiMoi(id);
        ghi(`ws=${id} boc cach ke ${boc.soDaBoc} bai`);
        for (const c of boc.canhBao) ghi(`ws=${id} canh bao boc: ${c}`);
      } catch (loi) {
        ghi(`ws=${id} boc HONG: ${loi.message}`);
      }
    }
  }

  ghi(`xong: ${tongBaiMoi} bai moi, ${tongChiPhi.toFixed(4)} USD`);
  await heThong.pool.end();
}

chay().catch((loi) => {
  ghi(`HONG TOAN LUOT: ${loi.stack || loi.message}`);
  process.exitCode = 1;
});
