'use strict';

require('tsx/cjs');

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { taoDichVuSuaBanNhap } = require('../lib/studio/sua-ban-nhap.ts');

function taoNen(trangThai = 'ban_nhap') {
  const daSua = [];
  const repo  = {
    contents: {
      layTheoId : async (id) => id === 'content-a' ? { id, trangThai } : null,
      sua        : async (id, giaTri) => {
        daSua.push({ id, giaTri });
        return { id, ...giaTri };
      },
    },
  };
  return {
    daSua,
    dichVu: taoDichVuSuaBanNhap({ createRepo: () => repo }),
  };
}

test('sửa nội dung và cập nhật câu mở đầu của bản nháp', async () => {
  const { daSua, dichVu } = taoNen();
  const ketQua = await dichVu({
    workspaceId : 'ws-a',
    contentId   : 'content-a',
    noiDung     : '  Dòng mở đầu\n\nNội dung tiếp theo.  ',
  });

  assert.deepEqual(ketQua, {
    ok      : true,
    duLieu  : { contentId: 'content-a' },
    canhBao : [],
  });
  assert.deepEqual(daSua, [{
    id      : 'content-a',
    giaTri : { noiDung: 'Dòng mở đầu\n\nNội dung tiếp theo.', cauMoDau: 'Dòng mở đầu' },
  }]);
});

test('không sửa nội dung ngoài workspace hoặc không còn là bản nháp', async () => {
  const khongCo             = taoNen();
  const khongPhaiBanNhap    = taoNen('san_sang');
  const ketQuaKhongCo       = await khongCo.dichVu({ workspaceId: 'ws-a', contentId: 'content-b', noiDung: 'Nội dung' });
  const ketQuaKhongBanNhap  = await khongPhaiBanNhap.dichVu({ workspaceId: 'ws-a', contentId: 'content-a', noiDung: 'Nội dung' });

  assert.equal(ketQuaKhongCo.ok, false);
  assert.equal(ketQuaKhongBanNhap.ok, false);
  assert.deepEqual(khongCo.daSua, []);
  assert.deepEqual(khongPhaiBanNhap.daSua, []);
});

test('từ chối nội dung rỗng', async () => {
  const { daSua, dichVu } = taoNen();
  const ketQua = await dichVu({ workspaceId: 'ws-a', contentId: 'content-a', noiDung: '   ' });

  assert.equal(ketQua.ok, false);
  assert.deepEqual(daSua, []);
});
