'use strict';

/** Chỉ dẫn riêng cho nhiệm vụ dựng kịch bản quay theo từng phân cảnh cho AI. */
const KHOI_SINH_KICH_BAN = [
  'VIET KICH BAN QUAY VIDEO TU Y TUONG DA DUYET:',
  '- `yTuong` la neo chinh. Bam tieu de, goc tiep can, cau mo dau va ly do de xuat;',
  '  khong doi sang chu de khac de kich ban de quay hon.',
  '- `hoSo` quy dinh giong thuong hieu. Chi dung su that co trong `truCot`,',
  '  `chanDung`, `sanPham` va `insight`; thieu du lieu thi viet trung tinh, khong tu bia.',
  '- Moi phan canh la MOT don vi quay ro rang: `thoiLuongGiay` phai lon hon 0,',
  '  `hinhAnh` mo ta chu the, hanh dong hoac khung hinh cu the co the quay duoc.',
  '- `loiThoai` phai ngan, tu nhien va noi duoc trong thoi luong cua canh. Canh',
  '  khong co loi thoai duoc phep dung chuoi rong.',
  '- Cac canh phai noi thanh mot mach: mo gay chu y, van de, chung minh hoac giai',
  '  phap, ket qua co boi canh, roi mot hanh dong tiep theo phu hop.',
  '- `thoiLuongMucTieuGiay`, neu co, la tong thoi luong BAT BUOC. Cong lai',
  '  `thoiLuongGiay` cua moi canh va can doi truoc khi tra ve.',
  '- Khong viet ca kich ban thanh mot doan van va khong chen chi dan quay vao `loiThoai`.',
].join('\n');

module.exports = { KHOI_SINH_KICH_BAN };
