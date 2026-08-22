'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { taoDichVuSinhBai } = require('../lib/studio/sinh-bai.ts');

function taoNen(tuyChon = {}) {
  const trangThai = { soChayMay: 0, thamSoMay: null };
  const yTuong = tuyChon.yTuong === null ? null : {
    id            : 'idea-a',
    beMat         : 'fanpage',
    tieuDe        : 'Một góc viết thật',
    gocTiepCan    : 'Nỗi lo thiếu thời gian',
    cauMoDau      : 'Bạn không cần làm mọi thứ một mình.',
    lyDoDeXuat    : 'Bám đúng nỗi đau của chủ shop.',
    pillarId      : 'pillar-a',
    personaId     : 'persona-a',
    productId     : 'product-a',
    lienKetNguon  : 'https://khong-duoc-gui.test',
    trendSignalId : 'trend-khong-duoc-gui',
  };
  const repo = {
    yTuong   : { layChiTietTheoId: async () => yTuong },
    hoSo     : { lay: async () => ({ workspaceId: 'ws-a', moTa: 'Shop nhỏ', giongDieu: 'Gần gũi', dieuCamKy: 'Không hứa quá' }) },
    truCot   : { layTheoId: async () => ({ id: 'pillar-a', workspaceId: 'ws-a', ten: 'Giáo dục', mucDich: 'Giải thích dễ hiểu' }) },
    chanDung : { layTheoId: async () => ({ id: 'persona-a', workspaceId: 'ws-a', ten: 'Chủ shop', noiDau: 'Thiếu thời gian', mongMuon: 'Đăng đều' }) },
    sanPham  : { layTheoId: async () => ({ id: 'product-a', workspaceId: 'ws-a', ten: 'Gói nội dung', loiIch: 'Giảm thao tác lặp', loiKeuGoi: 'Dùng thử' }) },
    insight  : { list: async () => [{ id: 'insight-a', workspaceId: 'ws-a', noiDung: 'Muốn tự duyệt bản cuối' }] },
  };
  const phuThuoc = {
    createRepo  : () => repo,
    chayNhiemVu : async (thamSo) => {
      trangThai.soChayMay += 1;
      trangThai.thamSoMay = thamSo;
      return tuyChon.ketQuaMay ?? {
        trangThai : 'xong',
        ketQua    : { tieuDe: ' Bài hoàn chỉnh ', noiDung: ' Nội dung có ích. ', hashtag: [' shop ', '', 12] },
        loi       : null,
      };
    },
  };
  return { phuThuoc, trangThai };
}

test('service dựng payload allowlist và gọi đúng nhiệm vụ viết bài', async () => {
  const { phuThuoc, trangThai } = taoNen();
  const ketQua = await taoDichVuSinhBai(phuThuoc)({ workspaceId: 'ws-a', ideaId: 'idea-a' });

  assert.equal(ketQua.ok, true);
  assert.deepEqual(ketQua.duLieu, {
    tieuDe: 'Bài hoàn chỉnh', noiDung: 'Nội dung có ích.', hashtag: ['shop'],
  });
  assert.equal(trangThai.thamSoMay.nhiemVu, 'viet-bai');
  assert.equal(trangThai.thamSoMay.khongGianLamViec, 'ws-a');
  assert.equal(trangThai.thamSoMay.duLieuVao.bienThe, 'fanpage');
  assert.deepEqual(Object.keys(trangThai.thamSoMay.duLieuVao.yTuong), [
    'tieuDe', 'gocTiepCan', 'cauMoDau', 'lyDoDeXuat', 'beMat',
  ]);
  assert.equal(JSON.stringify(trangThai.thamSoMay.duLieuVao).includes('khong-duoc-gui'), false);
  assert.equal(JSON.stringify(trangThai.thamSoMay.duLieuVao).includes('workspaceId'), false);
});

test('service từ chối ý tưởng không thuộc workspace trước khi gọi mô hình', async () => {
  const { phuThuoc, trangThai } = taoNen({ yTuong: null });
  const ketQua = await taoDichVuSinhBai(phuThuoc)({ workspaceId: 'ws-a', ideaId: 'idea-khac' });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không tìm thấy/i);
  assert.equal(trangThai.soChayMay, 0);
});

test('service loại kết quả mô hình thiếu nội dung bắt buộc', async () => {
  const { phuThuoc } = taoNen({
    ketQuaMay: { trangThai: 'xong', ketQua: { tieuDe: 'Có tiêu đề', noiDung: '  ' }, loi: null },
  });
  const ketQua = await taoDichVuSinhBai(phuThuoc)({ workspaceId: 'ws-a', ideaId: 'idea-a' });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không hợp lệ/i);
});
