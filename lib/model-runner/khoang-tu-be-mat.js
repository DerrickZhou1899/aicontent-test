'use strict';

/**
 * Tran do dai cua tung be mat — NGUON SU THAT DUY NHAT cho ca he thong.
 *
 * `loi-nhac-theo-nhiem-vu.js` dung bang nay de in cac dong "DO DAI BAT BUOC",
 * va `lib/studio/cong-dem-tu.ts` doc dung bang nay de dem lai sau khi mo hinh
 * tra bai. De hai noi tu go so la mot ngay nao do loi nhac bao 120 con cong dem
 * tu bao 150 — bai bi sinh lai vo co, hoac te hon, bai vuot tran lot qua ma
 * khong ai biet.
 *
 * VI SAO LA MOT FILE RIENG chu khong nam trong `loi-nhac-theo-nhiem-vu.js`:
 * man hinh soan bai dem tu ngay khi nguoi dung go, nen bang nay phai chay duoc
 * o trinh duyet. Neu no nam cung file loi nhac thi toan bo van ban giong thuong
 * hieu va bon khoi giong be mat se bi dong goi vao bundle cua trinh duyet — day
 * la tai san bien tap cua kenh, khong co ly do gi de gui ra ngoai may chu.
 *
 * DON VI: TIENG cach nhau boi khoang trang (xem `cong-dem-tu.ts`).
 */
const KHOANG_TU_BE_MAT = {
  fanpage: { toiThieu: 150, toiDa: 300 },
  ho_so_ca_nhan: { toiThieu: 120, toiDa: 250 },
  tiktok: { toiThieu: 60, toiDa: 120 },
  zalo: { toiThieu: 40, toiDa: 100 },
};

module.exports = { KHOANG_TU_BE_MAT };
