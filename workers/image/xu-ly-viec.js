'use strict';

function taoLoiNhac(bai) {
  const noiDung = typeof bai.noiDung === 'string' ? bai.noiDung.trim().slice(0, 6000) : '';
  const goc = typeof bai.gocTiepCan === 'string' ? bai.gocTiepCan.trim() : '';
  const moDau = typeof bai.cauMoDau === 'string' ? bai.cauMoDau.trim() : '';
  return [
    'Tạo một ảnh vuông 1:1 để minh họa bài đăng Facebook dưới đây.',
    'Ảnh phải rõ chủ thể, tự nhiên, phù hợp chủ shop nhỏ và không chèn chữ lên ảnh.',
    'Không tự thêm logo, giá, cam kết hoặc chi tiết sản phẩm không có trong bài.',
    goc ? `Góc tiếp cận: ${goc}` : null,
    moDau ? `Câu mở đầu: ${moDau}` : null,
    `Nội dung bài: ${noiDung}`,
  ].filter(Boolean).join('\n');
}

function loiNgan(loi) {
  return loi instanceof Error ? loi.message.slice(0, 500) : 'Không thể sinh ảnh';
}

/** Worker đọc lại bài từ repo workspace để không tin nội dung do job giả mạo. */
function taoChayViec(phuThuoc) {
  return async function chayViec(viec) {
    const contentId = viec?.duLieuVao?.contentId;
    const tiLe = viec?.duLieuVao?.tiLe;
    if (typeof contentId !== 'string' || tiLe !== '1:1') {
      return { thanhCong: false, loi: 'Dữ liệu việc sinh ảnh không hợp lệ' };
    }

    try {
      const repo = phuThuoc.repoTheoWorkspace(viec.workspaceId);
      const bai  = await repo.contents.layTheoId(contentId);
      if (!bai || typeof bai.noiDung !== 'string' || bai.noiDung.trim() === '') {
        return { thanhCong: false, loi: 'Không tìm thấy nội dung để sinh ảnh' };
      }

      const anh = await phuThuoc.goiSinhAnh({ loiNhac: taoLoiNhac(bai), tiLe });
      const tep = await phuThuoc.luu({
        workspaceId : viec.workspaceId,
        mimeType     : anh.mimeType,
        duLieu       : anh.duLieu,
      });
      const cacAsset = await repo.asset.theoNoiDung([contentId]);
      // Job có thể retry sau khi asset đã ghi nhưng chưa kịp đánh dấu `xong`.
      const assetDaCo = cacAsset.find((muc) => (
        muc.loai === 'anh' && muc.duongDan === tep.duongDan
      ));
      const asset = assetDaCo ?? await repo.asset.tao({
        contentId,
        loai          : 'anh',
        duongDan      : tep.duongDan,
        tiLe,
        kichThuocByte : tep.kichThuocByte,
      });
      return {
        thanhCong : true,
        ketQua    : { assetId: asset.id, duongDan: tep.duongDan, tiLe },
      };
    } catch (loi) {
      return { thanhCong: false, loi: loiNgan(loi) };
    }
  };
}

module.exports = { taoChayViec };
