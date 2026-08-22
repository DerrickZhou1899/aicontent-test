/**
 * Danh sach email duoc phep dang nhap.
 *
 * "Dang nhap bang Gmail" nghia la BAT KY ai co tai khoan Google deu tao duoc
 * khong gian lam viec — moi nguoi la la mot nguoi dot thue bao CLI va han muc
 * Apify cua chu du an. V1 chua co han muc (F11 o V2) nen chan bang danh sach.
 *
 * Viet bang .mjs chu khong phai .ts co chu dich: `npm test` chay
 * `node --test tests/` bang Node 20, ma Node 20 KHONG boc duoc kieu TypeScript
 * (--experimental-strip-types chi co tu Node 22.6). Day la manh logic thuan duy
 * nhat cua Phase 6 bat buoc phai co test tu dong, nen no phai la JavaScript that.
 */

/**
 * Tach bien moi truong thanh danh sach email da chuan hoa.
 *
 * @param {string | undefined} giaTriBien Noi dung AUTH_ALLOWED_EMAILS
 * @returns {string[]}
 */
export function docDanhSachChoPhep(giaTriBien) {
  if (typeof giaTriBien !== 'string') return [];
  return giaTriBien
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Email nay co duoc dang nhap khong.
 *
 * Danh sach rong => TU CHOI TAT CA. Coi rong la "cho tat ca" bien mot bien moi
 * truong bi quen thanh cong mo: dung cai gia phai tra la khoa nham chu du an,
 * con chieu kia la ai cung dang nhap duoc.
 *
 * @param {string | null | undefined} email Email tu ho so Google
 * @param {string | undefined} giaTriBien Noi dung AUTH_ALLOWED_EMAILS
 * @returns {boolean}
 */
export function emailDuocPhep(email, giaTriBien) {
  if (typeof email !== 'string') return false;
  const canChuan = email.trim().toLowerCase();
  if (canChuan.length === 0) return false;
  return docDanhSachChoPhep(giaTriBien).includes(canChuan);
}
