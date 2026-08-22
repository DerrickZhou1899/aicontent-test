'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { taoDichVuSinhKichBan } = require('../lib/studio/sinh-kich-ban.ts');

function taoNen(tuyChon = {}) {
  const trangThai = { soChayMay: 0, thamSoMay: null };
  const yTuong = tuyChon.yTuong === null ? null : {
    id            : 'idea-a',
    beMat         : 'tiktok',
    tieuDe        : 'Một ngày bận rộn',
    gocTiepCan    : 'Giảm thao tác lặp',
    cauMoDau      : 'Bạn đang làm cùng một việc mỗi ngày?',
    lyDoDeXuat    : 'Bám nỗi đau thiếu thời gian.',
    pillarId      : 'pillar-a',
    personaId     : 'persona-a',
    productId     : 'product-a',
    lienKetNguon  : 'https://khong-duoc-gui.test',
    trendSignalId : 'trend-khong-duoc-gui',
  };
  const repo = {
    yTuong   : { layChiTietTheoId: async () => yTuong },
    hoSo     : { lay: async () => ({ workspaceId: 'ws-a', moTa: 'Shop nhỏ', giongDieu: 'Gần gũi', dieuCamKy: 'Không hứa quá' }) },
    truCot   : { layTheoId: async () => ({ id: 'pillar-a', ten: 'Giáo dục', mucDich: 'Giải thích dễ hiểu' }) },
    chanDung : { layTheoId: async () => ({ id: 'persona-a', ten: 'Chủ shop', noiDau: 'Thiếu thời gian', mongMuon: 'Đăng đều' }) },
    sanPham  : { layTheoId: async () => ({ id: 'product-a', ten: 'Gói nội dung', loiIch: 'Giảm thao tác lặp', loiKeuGoi: 'Dùng thử' }) },
    insight  : { list: async () => [{ id: 'insight-a', noiDung: 'Muốn tự duyệt bản cuối' }] },
  };
  const phuThuoc = {
    createRepo  : () => repo,
    chayNhiemVu : async (thamSo) => {
      trangThai.soChayMay += 1;
      trangThai.thamSoMay = thamSo;
      return tuyChon.ketQuaMay ?? {
        trangThai : 'xong',
        ketQua    : {
          tieuDe  : ' Kịch bản đã dọn ',
          phanCanh: [{ thoiLuongGiay: 5, hinhAnh: ' Cận cảnh điện thoại ', loiThoai: ' Mở đầu ' }],
        },
        loi: null,
      };
    },
  };
  return { phuThuoc, trangThai };
}

test('service dựng payload allowlist và gọi đúng nhiệm vụ viết kịch bản', async () => {
  const { phuThuoc, trangThai } = taoNen();
  const ketQua = await taoDichVuSinhKichBan(phuThuoc)({
    workspaceId: 'ws-a', ideaId: 'idea-a', thoiLuongMucTieuGiay: 45,
  });

  assert.equal(ketQua.ok, true);
  assert.deepEqual(ketQua.duLieu, {
    tieuDe  : 'Kịch bản đã dọn',
    phanCanh: [{ thoiLuongGiay: 5, hinhAnh: 'Cận cảnh điện thoại', loiThoai: 'Mở đầu' }],
  });
  assert.equal(trangThai.thamSoMay.nhiemVu, 'viet-kich-ban');
  assert.equal(trangThai.thamSoMay.khongGianLamViec, 'ws-a');
  assert.equal(trangThai.thamSoMay.duLieuVao.bienThe, 'tiktok');
  assert.equal(trangThai.thamSoMay.duLieuVao.thoiLuongMucTieuGiay, 45);
  assert.deepEqual(Object.keys(trangThai.thamSoMay.duLieuVao.yTuong), [
    'tieuDe', 'gocTiepCan', 'cauMoDau', 'lyDoDeXuat', 'beMat',
  ]);
  assert.equal(JSON.stringify(trangThai.thamSoMay.duLieuVao).includes('khong-duoc-gui'), false);
  assert.equal(JSON.stringify(trangThai.thamSoMay.duLieuVao).includes('workspaceId'), false);
  for (const id of ['idea-a', 'pillar-a', 'persona-a', 'product-a', 'insight-a']) {
    assert.equal(JSON.stringify(trangThai.thamSoMay.duLieuVao).includes(id), false);
  }
});

test('service không gửi thời lượng mục tiêu không hợp lệ', async () => {
  for (const thoiLuong of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const { phuThuoc, trangThai } = taoNen();
    await taoDichVuSinhKichBan(phuThuoc)({
      workspaceId: 'ws-a', ideaId: 'idea-a', thoiLuongMucTieuGiay: thoiLuong,
    });

    assert.equal('thoiLuongMucTieuGiay' in trangThai.thamSoMay.duLieuVao, false);
  }
});

test('service từ chối ý tưởng ngoài workspace trước khi gọi mô hình', async () => {
  const { phuThuoc, trangThai } = taoNen({ yTuong: null });
  const ketQua = await taoDichVuSinhKichBan(phuThuoc)({ workspaceId: 'ws-a', ideaId: 'idea-khac' });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không tìm thấy/i);
  assert.equal(trangThai.soChayMay, 0);
});

test('service loại kết quả mô hình không còn phân cảnh hợp lệ', async () => {
  const { phuThuoc } = taoNen({
    ketQuaMay: { trangThai: 'xong', ketQua: { tieuDe: 'Có tiêu đề', phanCanh: [] }, loi: null },
  });
  const ketQua = await taoDichVuSinhKichBan(phuThuoc)({ workspaceId: 'ws-a', ideaId: 'idea-a' });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không hợp lệ/i);
});

test('service trả lỗi có kiểm soát khi không đọc được dữ liệu', async () => {
  const { phuThuoc } = taoNen();
  phuThuoc.createRepo = () => { throw new Error('database unavailable'); };

  const ketQua = await taoDichVuSinhKichBan(phuThuoc)({ workspaceId: 'ws-a', ideaId: 'idea-a' });

  assert.equal(ketQua.ok, false);
  assert.match(ketQua.loi, /không thể đọc dữ liệu/i);
});
