'use strict';

/**
 * Bo chay Claude Code CLI.
 *
 * Chi giu phan RIENG cua mo hinh nay; phan chung (dung thu muc viec, goi
 * run-in-sandbox.sh, doc ket qua, xoa thu muc) nam o chay-hop-cach-ly.js.
 *
 * `nhan` la chuoi ghi vao `model_runs.mo_hinh`. Doi chuoi nay la mat kha nang
 * so sanh voi du lieu cu — PRD 8.3 muon tra loi "mo hinh nao viet cau mo dau ra
 * nhieu binh luan co y dinh hon" bang du lieu that.
 */

const { chayTrongHopCachLy } = require('./chay-hop-cach-ly');

const NHAN = 'claude-cli';

/** @param {{ nhiemVu: string, loiNhac: string, duLieuVao: object, hetGioMs?: number }} thamSo */
async function chay(thamSo) {
  return chayTrongHopCachLy({ ...thamSo, moHinhHop: 'claude' });
}

module.exports = { NHAN, chay };
