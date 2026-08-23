'use strict';

const assert = require('node:assert/strict');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

let goiGeminiSinhAnh;
let luuAnh;
let taoChayViec;
try {
  ({ goiGeminiSinhAnh } = require('../workers/image/gemini.js'));
  ({ luuAnh } = require('../workers/image/kho-anh.js'));
  ({ taoChayViec } = require('../workers/image/xu-ly-viec.js'));
} catch {
  goiGeminiSinhAnh = null;
  luuAnh = null;
  taoChayViec = null;
}

test('gọi Gemini bằng REST và lấy phần inlineData ảnh', async () => {
  let yeuCau;
  const fetchImpl = async (url, tuyChon) => {
    yeuCau = { url, tuyChon };
    return {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [
          { text: 'đang suy nghĩ', thought: true },
          { inlineData: { mimeType: 'image/png', data: Buffer.from('anh').toString('base64') } },
        ] } }],
      }),
    };
  };

  assert.equal(typeof goiGeminiSinhAnh, 'function');
  const ketQua = await goiGeminiSinhAnh({
    apiKey: 'khoa-test', moHinh: 'gemini-image-test', loiNhac: 'Vẽ ảnh vuông',
    tiLe: '1:1', fetchImpl,
  });

  assert.equal(ketQua.mimeType, 'image/png');
  assert.deepEqual(ketQua.duLieu, Buffer.from('anh'));
  assert.match(yeuCau.url, /models\/gemini-image-test:generateContent$/);
  assert.equal(yeuCau.tuyChon.headers['x-goog-api-key'], 'khoa-test');
  assert.ok(yeuCau.tuyChon.signal instanceof AbortSignal);
  const than = JSON.parse(yeuCau.tuyChon.body);
  assert.deepEqual(than.generationConfig.responseModalities, ['IMAGE']);
  assert.equal(than.generationConfig.imageConfig.aspectRatio, '1:1');
});

test('từ chối phản hồi không có ảnh hợp lệ', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: 'không có ảnh' }] } }] }),
  });

  await assert.rejects(
    goiGeminiSinhAnh({ apiKey: 'k', loiNhac: 'vẽ', tiLe: '1:1', fetchImpl }),
    /không trả về ảnh/i,
  );
});

test('lưu byte ảnh trong thư mục workspace bằng tên băm', async () => {
  const thuMucGoc = await mkdtemp(path.join(os.tmpdir(), 'aicontent-anh-'));
  try {
    assert.equal(typeof luuAnh, 'function');
    const ketQua = await luuAnh({
      thuMucGoc, workspaceId: 'ws-a', mimeType: 'image/png', duLieu: Buffer.from('anh'),
    });

    assert.match(ketQua.duongDan, /^ws-a\/[a-f0-9]{64}\.png$/);
    assert.equal(ketQua.kichThuocByte, 3);
    assert.deepEqual(await readFile(path.join(thuMucGoc, ...ketQua.duongDan.split('/'))), Buffer.from('anh'));
  } finally {
    await rm(thuMucGoc, { recursive: true, force: true });
  }
});

test('worker đọc lại bài theo workspace, lưu ảnh rồi tạo asset', async () => {
  const daTao = [];
  const repo = {
    contents : { layTheoId: async () => ({
      id: 'content-a', cauMoDau: 'Mở đầu', gocTiepCan: 'Góc thật', noiDung: 'Nội dung đã lưu',
    }) },
    asset : {
      theoNoiDung : async () => [],
      tao         : async (giaTri) => {
        daTao.push(giaTri);
        return { id: 'asset-a' };
      },
    },
  };
  let loiNhac;
  const chayViec = taoChayViec({
    repoTheoWorkspace : () => repo,
    goiSinhAnh        : async (thamSo) => {
      loiNhac = thamSo.loiNhac;
      return { mimeType: 'image/png', duLieu: Buffer.from('anh') };
    },
    luu               : async () => ({ duongDan: 'ws-a/anh.png', kichThuocByte: 3 }),
  });

  const ketQua = await chayViec({
    id: 'job-a', workspaceId: 'ws-a', duLieuVao: { contentId: 'content-a', tiLe: '1:1' },
  });

  assert.equal(ketQua.thanhCong, true);
  assert.match(loiNhac, /Nội dung đã lưu/);
  assert.deepEqual(daTao, [{
    contentId: 'content-a', loai: 'anh', duongDan: 'ws-a/anh.png',
    tiLe: '1:1', kichThuocByte: 3,
  }]);
  assert.deepEqual(ketQua.ketQua, {
    assetId: 'asset-a', duongDan: 'ws-a/anh.png', tiLe: '1:1',
  });
});

test('worker không gọi API khi bài không thuộc workspace', async () => {
  let daGoi = false;
  const chayViec = taoChayViec({
    repoTheoWorkspace : () => ({
      contents: { layTheoId: async () => null },
      asset: { theoNoiDung: async () => [], tao: async () => null },
    }),
    goiSinhAnh : async () => { daGoi = true; },
    luu        : async () => null,
  });

  const ketQua = await chayViec({
    id: 'job-a', workspaceId: 'ws-a', duLieuVao: { contentId: 'content-khac', tiLe: '1:1' },
  });

  assert.equal(ketQua.thanhCong, false);
  assert.equal(daGoi, false);
});

test('worker retry tái sử dụng asset đã ghi thay vì tạo dòng trùng', async () => {
  let soLanTao = 0;
  const repo = {
    contents : { layTheoId: async () => ({ id: 'content-a', noiDung: 'Bài đã lưu' }) },
    asset    : {
      theoNoiDung : async () => [{ id: 'asset-cu', loai: 'anh', duongDan: 'ws-a/anh.png' }],
      tao         : async () => { soLanTao += 1; },
    },
  };
  const chayViec = taoChayViec({
    repoTheoWorkspace : () => repo,
    goiSinhAnh        : async () => ({ mimeType: 'image/png', duLieu: Buffer.from('anh') }),
    luu               : async () => ({ duongDan: 'ws-a/anh.png', kichThuocByte: 3 }),
  });

  const ketQua = await chayViec({
    id: 'job-a', workspaceId: 'ws-a', duLieuVao: { contentId: 'content-a', tiLe: '1:1' },
  });

  assert.equal(ketQua.thanhCong, true);
  assert.equal(ketQua.ketQua.assetId, 'asset-cu');
  assert.equal(soLanTao, 0);
});

test('tiến trình worker ảnh chỉ nhận job sinh-anh', () => {
  let diemVao;
  try {
    diemVao = require('../workers/image/index.js');
  } catch {
    diemVao = null;
  }

  assert.ok(diemVao);
  assert.deepEqual(diemVao.LOAI_VIEC_NHAN, ['sinh-anh']);
  assert.equal(typeof diemVao.chinh, 'function');
});
