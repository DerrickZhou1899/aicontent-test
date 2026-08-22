'use strict';

const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const duongDan = join(
  __dirname, '..', 'app', '(dash)', 'studio', 'hang-loat', 'actions.ts',
);

test('actions hàng loạt lấy workspace từ phiên và gọi đúng service', () => {
  assert.equal(existsSync(duongDan), true, 'chưa có server actions cho màn hình hàng loạt');
  const maNguon = readFileSync(duongDan, 'utf8');

  assert.match(maNguon, /export async function guiXepLo/);
  assert.match(maNguon, /form\.getAll\(['"]ideaIds['"]\)/);
  assert.match(maNguon, /sinhHangLoat\(/);
  assert.match(maNguon, /export async function guiDocTrangThaiLo/);
  assert.match(maNguon, /guiDocTrangThaiLo\(\s*viec:\s*ViecTheoDoi\[\]/);
  assert.match(maNguon, /docTrangThaiLo\(/);
  assert.match(maNguon, /workspaceId\s*:\s*await workspaceHienTai\(\)/g);
  assert.doesNotMatch(maNguon, /form\.(?:get|getAll)\(['"][^'"]*(?:workspace|job)[^'"]*['"]\)/i);
});

test('action polling kiểm tra cấu trúc danh sách trước khi gọi service', () => {
  assert.equal(existsSync(duongDan), true, 'chưa có server actions cho màn hình hàng loạt');
  const maNguon = readFileSync(duongDan, 'utf8');

  assert.match(maNguon, /Array\.isArray\(viec\)/);
  assert.match(maNguon, /typeof muc\?\.ideaId/);
  assert.match(maNguon, /typeof muc\?\.jobId/);
});
