import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  docDanhSachChoPhep,
  emailDuocPhep,
} from '../lib/auth/danh-sach-email-cho-phep.mjs';

describe('docDanhSachChoPhep', () => {
  it('tach theo dau phay, bo khoang trang, ha chu thuong', () => {
    assert.deepEqual(docDanhSachChoPhep(' A@Gmail.com , b@example.com '), [
      'a@gmail.com',
      'b@example.com',
    ]);
  });

  it('bo qua phan tu rong do dau phay thua', () => {
    assert.deepEqual(docDanhSachChoPhep('a@x.com,,  ,b@x.com,'), ['a@x.com', 'b@x.com']);
  });

  it('bien khong duoc dat thi danh sach rong', () => {
    assert.deepEqual(docDanhSachChoPhep(undefined), []);
    assert.deepEqual(docDanhSachChoPhep(''), []);
  });
});

describe('emailDuocPhep', () => {
  const danhSach = 'tuyendung@example.com, nhansu@example.com';

  it('email trong danh sach thi duoc vao', () => {
    assert.equal(emailDuocPhep('tuyendung@example.com', danhSach), true);
    assert.equal(emailDuocPhep('nhansu@example.com', danhSach), true);
  });

  it('khong phan biet hoa thuong va khoang trang thua', () => {
    assert.equal(emailDuocPhep('  TuyenDung@Example.COM ', danhSach), true);
  });

  it('email ngoai danh sach bi tu choi', () => {
    assert.equal(emailDuocPhep('nguoila@gmail.com', danhSach), false);
  });

  // Tro choi chu de lot: "tuyendung@example.com.attacker.com" chua nguyen van
  // email that. Phai so khop CA CHUOI, khong duoc dung includes/startsWith.
  it('khong an chieu email chua chuoi con hop le', () => {
    assert.equal(emailDuocPhep('tuyendung@example.com.attacker.com', danhSach), false);
    assert.equal(emailDuocPhep('xtuyendung@example.com', danhSach), false);
  });

  // Cho de hong am tham nhat: quen dat bien moi truong. Neu coi rong la "cho tat
  // ca" thi bat ky ai co tai khoan Google deu dang nhap duoc.
  it('danh sach rong thi TU CHOI TAT CA, khong phai cho tat ca', () => {
    assert.equal(emailDuocPhep('tuyendung@example.com', ''), false);
    assert.equal(emailDuocPhep('tuyendung@example.com', undefined), false);
  });

  it('email rong hoac khong phai chuoi thi bi tu choi', () => {
    assert.equal(emailDuocPhep('', danhSach), false);
    assert.equal(emailDuocPhep(null, danhSach), false);
    assert.equal(emailDuocPhep(undefined, danhSach), false);
  });
});
