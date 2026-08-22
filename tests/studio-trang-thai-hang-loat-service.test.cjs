'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

let taoDichVuDocTrangThaiLo;
try {
  ({ taoDichVuDocTrangThaiLo } = require('../lib/studio/trang-thai-hang-loat.ts'));
} catch {
  taoDichVuDocTrangThaiLo = null;
}

function taoNen(dong = []) {
  const trangThai = { soLanDoc: 0, ids: null };
  const phuThuoc = {
    createRepo: () => ({
      jobs: {
        layNhieuTheoId: async (ids) => {
          trangThai.soLanDoc += 1;
          trangThai.ids = ids;
          return dong;
        },
      },
    }),
  };
  return { phuThuoc, trangThai };
}

function taoDichVu(phuThuoc) {
  assert.equal(typeof taoDichVuDocTrangThaiLo, 'function');
  return taoDichVuDocTrangThaiLo(phuThuoc);
}

const VIEC = [
  { ideaId: 'idea-a', jobId: 'job-a' },
  { ideaId: 'idea-b', jobId: 'job-b' },
];

test('service đọc cả lô một lần và trả đúng thứ tự ý tưởng', async () => {
  const { phuThuoc, trangThai } = taoNen([
    {
      id: 'job-b', trangThai: 'xong', loi: null,
      ketQua: { tieuDe: ' Bài B ', noiDung: ' Nội dung B ', hashtag: [' shop '] },
    },
    { id: 'job-a', trangThai: 'dang_chay', ketQua: null, loi: null },
  ]);
  const ketQua = await taoDichVu(phuThuoc)({ workspaceId: 'ws-a', viec: VIEC });

  assert.equal(ketQua.ok, true);
  assert.equal(trangThai.soLanDoc, 1);
  assert.deepEqual(trangThai.ids, ['job-a', 'job-b']);
  assert.deepEqual(ketQua.duLieu, [
    { ideaId: 'idea-a', jobId: 'job-a', trangThai: 'dang_chay', banNhap: null, loi: null },
    {
      ideaId: 'idea-b', jobId: 'job-b', trangThai: 'xong',
      banNhap: { tieuDe: 'Bài B', noiDung: 'Nội dung B', hashtag: ['shop'] }, loi: null,
    },
  ]);
});

test('service từ chối lô rỗng, quá 10 hoặc trùng job trước khi đọc', async () => {
  const quaMuoi = Array.from({ length: 11 }, (_, i) => ({ ideaId: `idea-${i}`, jobId: `job-${i}` }));
  const trungSauKhiDon = [VIEC[0], { ideaId: ' idea-a ', jobId: 'job-b' }];
  for (const viec of [
    [], quaMuoi, [VIEC[0], { ideaId: 'idea-b', jobId: 'job-a' }], trungSauKhiDon,
  ]) {
    const { phuThuoc, trangThai } = taoNen();
    const ketQua = await taoDichVu(phuThuoc)({ workspaceId: 'ws-a', viec });

    assert.equal(ketQua.ok, false);
    assert.equal(trangThai.soLanDoc, 0);
  }
});

test('service không trả dữ liệu nếu có job ngoài workspace', async () => {
  const { phuThuoc } = taoNen([
    { id: 'job-a', trangThai: 'xong', ketQua: { tieuDe: 'A', noiDung: 'B' }, loi: null },
  ]);
  const ketQua = await taoDichVu(phuThuoc)({ workspaceId: 'ws-a', viec: VIEC });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không thuộc không gian làm việc/i);
});

test('service đổi kết quả hoàn tất sai định dạng thành lỗi an toàn', async () => {
  const { phuThuoc } = taoNen([
    { id: 'job-a', trangThai: 'xong', ketQua: { tieuDe: 'Thiếu nội dung' }, loi: null },
  ]);
  const ketQua = await taoDichVu(phuThuoc)({ workspaceId: 'ws-a', viec: [VIEC[0]] });

  assert.equal(ketQua.ok, true);
  assert.deepEqual(ketQua.duLieu[0], {
    ideaId: 'idea-a', jobId: 'job-a', trangThai: 'loi', banNhap: null,
    loi: 'Kết quả sinh bài không hợp lệ.',
  });
});

test('service không trả lỗi thô của worker ra ngoài', async () => {
  const { phuThuoc } = taoNen([
    { id: 'job-a', trangThai: 'loi', ketQua: null, loi: 'GEMINI_API_KEY=khong-duoc-lo' },
  ]);
  const ketQua = await taoDichVu(phuThuoc)({ workspaceId: 'ws-a', viec: [VIEC[0]] });

  assert.equal(ketQua.ok, true);
  assert.equal(ketQua.duLieu[0].loi, 'Không thể sinh bài này.');
  assert.equal(JSON.stringify(ketQua).includes('khong-duoc-lo'), false);
});
