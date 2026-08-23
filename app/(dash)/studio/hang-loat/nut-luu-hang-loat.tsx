'use client';

import { useState, useTransition } from 'react';

import type { BaiCanLuu } from '@/lib/studio/luu-hang-loat';

import { guiLuuHangLoat } from './actions';

type ThuocTinh = {
  bai : BaiCanLuu[];
};

export function NutLuuHangLoat({ bai }: ThuocTinh) {
  const [dangLuu, batDauLuu] = useTransition();
  const [ketQua, datKetQua]   = useState<Awaited<ReturnType<typeof guiLuuHangLoat>> | null>(null);

  function luu() {
    batDauLuu(async () => {
      datKetQua(await guiLuuHangLoat(bai));
    });
  }

  return (
    <div>
      <button
        className="btn btn--primary"
        type="button"
        disabled={dangLuu || ketQua?.ok}
        onClick={luu}
      >
        {dangLuu ? 'Đang lưu…' : ketQua?.ok ? 'Đã lưu bản nháp' : `Lưu ${bai.length} bản nháp`}
      </button>
      {ketQua?.ok ? (
        <p role="status">
          Đã lưu {ketQua.duLieu.soBai} bản nháp.{' '}
          <a href="/bai-da-tao">Xem bản nháp đã lưu</a>
        </p>
      ) : null}
      {ketQua && !ketQua.ok ? <p role="alert">{ketQua.loi}</p> : null}
    </div>
  );
}
