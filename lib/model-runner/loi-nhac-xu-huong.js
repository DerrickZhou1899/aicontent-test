'use strict';

/**
 * Hai khối lời nhắc cho luồng THEO DÕI KÊNH NGOÀI.
 *
 * TỆP RIÊNG chứ không viết thẳng vào `loi-nhac-theo-nhiem-vu.js`: tệp đó đã 279
 * dòng, quá ngưỡng 200 dòng của quy ước dự án. Hai khối dưới đây được ghép vào
 * lời nhắc gốc của hai nhiệm vụ đã có, không tạo nhiệm vụ mới và không thêm giá
 * trị enum nào.
 */

/**
 * Ghép vào `cham-diem-lien-quan`.
 *
 * Một lượt gọi làm HAI việc cho mỗi bài kênh ngoài: chấm điểm liên quan (đổ vào
 * cột `diem_lien_quan` đã có sẵn từ Phase 3) và bóc công thức kể (vào
 * `cong_thuc`). Gộp lại vì cả hai đều cần đọc hết bài — tách ra là trả tiền đọc
 * hai lần cho cùng một nội dung.
 *
 * `kieuHook` là KHÓA đóng, không phải văn bản tự do: mô hình chọn một trong tám
 * giá trị. Văn bản tự do thì mỗi lần chạy ra một tên khác và không bao giờ gom
 * nhóm được để thấy "cách kể nào đang ăn".
 */
const KIEU_HOOK = [
  'cau-hoi-nguoc',
  'con-so-gay-soc',
  'chuyen-ca-nhan',
  'sai-lam-thuong-gap',
  'truoc-sau',
  'canh-bao',
  'huong-dan-tung-buoc',
  'khoe-ket-qua',
];

const KHOI_BOC_CONG_THUC = [
  '',
  'Ngoai diem lien quan, voi MOI bai con phai boc ra CACH KE cua no:',
  `- "kieuHook": chon DUNG MOT trong: ${KIEU_HOOK.join(', ')}.`,
  '- "chuDe": 2 den 4 tu khoa ngan noi bai nay noi ve chuyen gi. Danh tu, khong',
  '  phai cau. Vi du ["gia von", "mo quan an"].',
  'Cau truc day du:',
  '{"diemLienQuan": [{"id": string, "diem": number, "lyDo": string,' +
    ' "kieuHook": string, "chuDe": [string]}]}',
].join('\n');

/**
 * PHẦN BÀI TEST — bạn tự viết khối này và ghép vào lời nhắc `de-xuat-y-tuong`.
 *
 * RÀNG BUỘC BẮT BUỘC, không được bỏ:
 * mô hình chỉ được thấy CHỦ ĐỀ và CÔNG THỨC KỂ của bài người ta, KHÔNG bao giờ
 * thấy nguyên văn bài đó. Đó là khác biệt giữa "học cách kể" và "viết lại bài
 * của người ta" — việc sau vừa không dùng được, vừa là rủi ro pháp lý.
 *
 * Ràng buộc này phải được ép ở TẦNG MÃ (hàm dựng lời nhắc không được nhận tham
 * số chứa nội dung bài gốc), không phải chỉ nhắc mô hình bằng chữ.
 */
const KHOI_Y_TUONG_TU_XU_HUONG = [
  '',
  'THAM KHAO XU HUONG AN TOAN:',
  '- Moi slot chi co chu de va cong thuc ke rut gon. Chi hoc chu de va cong thuc ke,',
  '  khong duoc viet lai cau chu, tieu de, hay cach dien dat cua bai nguon.',
  '- Tra ve dung so luong y tuong duoc yeu cau va dung thu tu slot trong du lieu vao.',
  '- Voi slot co khamPha=true, y tuong tuong ung phai tra ve "kham_pha": true.',
  '- Khong tu bia tru cot, chan dung, hay chi tiet khach hang khong co trong du lieu.',
].join('\n');

module.exports = { KIEU_HOOK, KHOI_BOC_CONG_THUC, KHOI_Y_TUONG_TU_XU_HUONG };
