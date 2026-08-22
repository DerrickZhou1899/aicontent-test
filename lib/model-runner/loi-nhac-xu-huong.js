'use strict';

/**
 * Hai khoi loi nhac cho luong THEO DOI KENH NGOAI.
 *
 * TEP RIENG chu khong viet thang vao `loi-nhac-theo-nhiem-vu.js`: tep do da 279
 * dong, qua nguong 200 dong cua quy uoc du an. Hai khoi duoi day duoc ghep vao
 * loi nhac goc cua hai nhiem vu da co, khong tao nhiem vu moi va khong them gia
 * tri enum nao.
 */

/**
 * Ghep vao `cham-diem-lien-quan`.
 *
 * Mot luot goi lam HAI viec cho moi bai kenh ngoai: cham diem lien quan (do vao
 * cot `diem_lien_quan` da co san tu Phase 3) va boc cong thuc ke (vao
 * `cong_thuc`). Gop lai vi ca hai deu can doc het bai — tach ra la tra tien doc
 * hai lan cho cung mot noi dung.
 *
 * `kieuHook` la KHOA dong, khong phai van ban tu do: mo hinh chon mot trong tam
 * gia tri. Van ban tu do thi moi lan chay ra mot ten khac va khong bao gio gom
 * nhom duoc de thay "cach ke nao dang an".
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
 * PHAN BAI TEST — ban tu viet khoi nay va ghep vao loi nhac `de-xuat-y-tuong`.
 *
 * RANG BUOC BAT BUOC, khong duoc bo:
 * mo hinh chi duoc thay CHU DE va CONG THUC KE cua bai nguoi ta, KHONG bao gio
 * thay nguyen van bai do. Do la khac biet giua "hoc cach ke" va "viet lai bai
 * cua nguoi ta" — viec sau vua khong dung duoc, vua la rui ro phap ly.
 *
 * Rang buoc nay phai duoc ep o TANG MA (ham dung loi nhac khong duoc nhan tham
 * so chua noi dung bai goc), khong phai chi nhac mo hinh bang chu.
 */
const KHOI_Y_TUONG_TU_XU_HUONG = '';

module.exports = { KIEU_HOOK, KHOI_BOC_CONG_THUC, KHOI_Y_TUONG_TU_XU_HUONG };
