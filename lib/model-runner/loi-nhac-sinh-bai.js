'use strict';

/**
 * Chỉ dẫn riêng cho nhiệm vụ viết bài.
 *
 * Tách khỏi tệp điều phối vì khối này sẽ còn thay đổi khi mốc biên soạn có thêm
 * kiểm định độ dài và chuỗi bài. Giữ riêng giúp mỗi lần sửa không làm tệp điều
 * phối vốn đã lớn tiếp tục phình ra.
 */
const KHOI_SINH_BAI = [
  'VIET MOT BAI DANG HOAN CHINH TU Y TUONG DA DUYET:',
  '- `yTuong` la neo chinh. Bam tieu de, goc tiep can, cau mo dau va ly do de xuat;',
  '  khong doi sang mot chu de khac de viet cho de.',
  '- `hoSo` quy dinh giong thuong hieu va dieu cam ky. `truCot`, `chanDung`,',
  '  `sanPham`, `insight` la du lieu nen co that. Chi dung chi tiet co trong cac',
  '  nhom nay; thieu du lieu thi viet trung tinh, khong tu bia so lieu hay loi ich.',
  '- Bai phai doc duoc nhu mot bai dang hoan chinh: mo dau ro, than bai co mach,',
  '  ket bai co dung mot hanh dong tiep theo phu hop.',
  '- `epDoDai`, neu co, la rang buoc so tu BAT BUOC. Tu dem va chinh lai truoc khi tra ve.',
  '- `mach`, neu co, la cac bai da viet trong cung chuoi. Noi tiep ngu canh nhung',
  '  khong lap lai y chinh, cau mo dau hay ket luan cua cac bai truoc.',
  '- `hashtag` la mang hashtag ngan, lien quan truc tiep; khong chen hashtag vao',
  '  `noiDung` va khong dung hashtag neu be mat cam hashtag.',
].join('\n');

module.exports = { KHOI_SINH_BAI };
