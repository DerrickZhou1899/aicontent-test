'use strict';

/** Cac ham thuan cua lop truu tuong goi mo hinh — khong cham CSDL, khong cham Docker. */

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  MAC_DINH_THEO_NHIEM_VU,
  MO_HINH_MANH,
  MO_HINH_NHANH,
  NHIEM_VU_HOP_LE,
  chonMoHinh,
  loaiViecCuaNhiemVu,
} = require('../lib/model-runner/chon-mo-hinh');
const { docJsonTuVanBan } = require('../lib/model-runner/thuc-thi-nhiem-vu');
const { layLoiNhac, loiNhacSuaDinhDang } = require('../lib/model-runner/loi-nhac-theo-nhiem-vu');
const { tinhChiPhiUocTinh } = require('../lib/model-runner/ghi-nhat-ky');
const runnerApi = require('../lib/model-runner/runner-api');

describe('chon mo hinh (PRD 8.3)', () => {
  it('bay nhiem vu cua PRD muc 8.2 deu co mac dinh va co loai viec tuong ung', () => {
    assert.equal(NHIEM_VU_HOP_LE.length, 7);
    for (const nhiemVu of NHIEM_VU_HOP_LE) {
      assert.ok(MAC_DINH_THEO_NHIEM_VU[nhiemVu], `thieu mac dinh cho ${nhiemVu}`);
      assert.ok(loaiViecCuaNhiemVu(nhiemVu), `thieu loai viec cho ${nhiemVu}`);
    }
  });

  it('viec sai mot lan la sai ca he thong -> mo hinh manh', () => {
    assert.equal(chonMoHinh('boc-tach-ho-so'), MO_HINH_MANH);
    assert.equal(chonMoHinh('de-xuat-y-tuong'), MO_HINH_MANH);
    assert.equal(chonMoHinh('viet-bai'), MO_HINH_MANH);
  });

  it('viec chay hang loat -> mo hinh nhanh/re', () => {
    assert.equal(chonMoHinh('cham-chat-luong'), MO_HINH_NHANH);
    assert.equal(chonMoHinh('phan-loai-binh-luan'), MO_HINH_NHANH);
    assert.equal(chonMoHinh('cham-diem-lien-quan'), MO_HINH_NHANH);
  });

  it('nguoi dung chon thi ton trong lua chon do', () => {
    assert.equal(chonMoHinh('cham-chat-luong', 'claude-cli'), 'claude-cli');
    assert.equal(chonMoHinh('viet-bai', 'codex-cli'), 'codex-cli');
  });

  it('nhiem vu la va mo hinh la deu bi tu choi ngay', () => {
    assert.throws(() => chonMoHinh('viet-bai', 'gpt-tu-che'), /moHinh khong hop le/);
    assert.throws(() => chonMoHinh('nau-an'), /nhiem vu khong biet/);
    assert.throws(() => loaiViecCuaNhiemVu('nau-an'), /nhiem vu khong biet/);
  });

  it('anh xa loai viec khop enum loai_viec cua luoc do', () => {
    // Danh sach nay chep tu db/schema/ops.ts (da dong bang). Lech la worker
    // se nem loi enum luc chen, phat hien luc chay thay vi luc test.
    const enumLoaiViec = new Set([
      'sinh-y-tuong', 'sinh-bai', 'sinh-kich-ban', 'cham-chat-luong',
      'boc-tach-ho-so', 'sinh-anh', 'kiem-tra-lien-ket', 'keo-so-lieu-lo',
      'quet-xu-huong', 'phan-loai-binh-luan', 'tinh-diem-hieu-qua', 'tong-hop-tuan',
    ]);
    for (const nhiemVu of NHIEM_VU_HOP_LE) {
      assert.ok(enumLoaiViec.has(loaiViecCuaNhiemVu(nhiemVu)), `sai loai viec cho ${nhiemVu}`);
    }
  });
});

describe('doc JSON tu van ban CLI tra ve', () => {
  it('JSON tran', () => {
    const ban = docJsonTuVanBan('{"tieuDe":"a","noiDung":"b"}');
    assert.equal(ban.ok, true);
    assert.equal(ban.giaTri.tieuDe, 'a');
  });

  it('JSON boc trong khoi rao ```json', () => {
    const ban = docJsonTuVanBan('Day la ket qua:\n```json\n{"tieuDe":"a"}\n```\nXong.');
    assert.equal(ban.ok, true);
    assert.equal(ban.giaTri.tieuDe, 'a');
  });

  it('JSON lan trong van ban', () => {
    const ban = docJsonTuVanBan('Toi nghi: {"tieuDe":"a","noiDung":"b"} - het.');
    assert.equal(ban.ok, true);
    assert.equal(ban.giaTri.noiDung, 'b');
  });

  it('mang o cap ngoai cung bi tu choi — hang doi luu object', () => {
    assert.equal(docJsonTuVanBan('[1,2,3]').ok, false);
  });

  it('van ban thuan va chuoi rong deu bi tu choi', () => {
    assert.equal(docJsonTuVanBan('xin chao').ok, false);
    assert.equal(docJsonTuVanBan('   ').ok, false);
  });
});

describe('loi nhac', () => {
  it('moi nhiem vu co loi nhac va danh sach truong bat buoc', () => {
    for (const nhiemVu of NHIEM_VU_HOP_LE) {
      const muc = layLoiNhac(nhiemVu);
      assert.ok(muc.loiNhac.length > 50);
      assert.ok(muc.truongBatBuoc.length > 0);
    }
  });

  it('loi nhac sua dinh dang co nhac lai ly do va giu nguyen dac ta cu', () => {
    const sua = loiNhacSuaDinhDang('viet-bai', 'ket qua rong');
    assert.match(sua, /SAI DINH DANG/);
    assert.match(sua, /ket qua rong/);
    assert.match(sua, /tieuDe/);
  });
});

describe('uoc tinh chi phi', () => {
  it('tinh theo tong do dai vao + ra, don vi nghin ky tu', () => {
    const ban = tinhChiPhiUocTinh(1000, 1000, 'claude-cli');
    assert.equal(ban.soLuong, 2);
    assert.equal(ban.chiPhiUocTinh, 24);
  });

  it('mo hinh la van ra so, khong nem loi — mat dong nhat ky ton hon uoc sai', () => {
    const ban = tinhChiPhiUocTinh(1000, 0, 'mo-hinh-tuong-lai');
    assert.equal(ban.soLuong, 1);
    assert.ok(ban.chiPhiUocTinh > 0);
  });
});

describe('runner-api', () => {
  it('thieu AI_PROVIDER thi thoat ma 2, khong nem loi', async () => {
    const truoc = process.env.AI_PROVIDER;
    delete process.env.AI_PROVIDER;
    try {
      const ban = await runnerApi.chay({ nhiemVu: 'viet-bai', loiNhac: '', duLieuVao: {} });
      // Ma 2 = dau vao sai, `thuc-thi-nhiem-vu.js` khong thu lai. Nem loi ra
      // ngoai thi mat dong ghi vao `model_runs` — lan chay hong van phai co so lieu.
      assert.equal(ban.maThoat, 2);
      assert.equal(ban.ok, false);
      assert.match(ban.nhatKy, /AI_PROVIDER/);
    } finally {
      if (truoc === undefined) delete process.env.AI_PROVIDER;
      else process.env.AI_PROVIDER = truoc;
    }
  });

  it('giu dung hinh dang ket qua ma thuc-thi-nhiem-vu.js doi', async () => {
    const truoc = process.env.AI_PROVIDER;
    delete process.env.AI_PROVIDER;
    try {
      const ban = await runnerApi.chay({ nhiemVu: 'viet-bai', loiNhac: '', duLieuVao: {} });
      for (const truong of [
        'maThoat', 'ok', 'ketQuaTho', 'thoiGianChayMs', 'soChuoiDaChe', 'canhBao', 'nhatKy',
      ]) {
        assert.ok(truong in ban, `thieu truong ${truong}`);
      }
      assert.ok(Array.isArray(ban.canhBao));
    } finally {
      if (truoc === undefined) delete process.env.AI_PROVIDER;
      else process.env.AI_PROVIDER = truoc;
    }
  });
});
