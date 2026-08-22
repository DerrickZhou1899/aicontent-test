'use strict';

/**
 * Bo chay Codex CLI.
 *
 * Can `codex login` tren may chu truoc khi dung — the dang nhap doc tu
 * `$HOME/.codex/auth.json` va duoc chep vao container o dang chi doc.
 *
 * Codex CLI la agent viet ma, KHONG sinh duoc anh (PRD ghi ro o phan Phase 12).
 * Dung nhan `sinh-anh` cho bo chay nay la sai ngay tu dau.
 */

const { chayTrongHopCachLy } = require('./chay-hop-cach-ly');

const NHAN = 'codex-cli';

/** @param {{ nhiemVu: string, loiNhac: string, duLieuVao: object, hetGioMs?: number }} thamSo */
async function chay(thamSo) {
  return chayTrongHopCachLy({ ...thamSo, moHinhHop: 'codex' });
}

module.exports = { NHAN, chay };
