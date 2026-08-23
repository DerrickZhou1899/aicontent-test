'use client';

import { useState, useTransition } from 'react';

import type { AnhDaSinh } from '@/lib/studio/sinh-anh';

import { XemAnh } from '../../studio/bien-soan/xem-anh';
import { guiSuaBanNhap } from '../actions';

type BanNhap = {
  id            : string;
  tieuDeYTuong  : string | null;
  noiDung       : string;
};

export function TrinhSuaBanNhap({
  banNhap,
  anhBanDau,
}: {
  banNhap   : BanNhap;
  anhBanDau : AnhDaSinh | null;
}) {
  const [noiDung, datNoiDung]   = useState(banNhap.noiDung);
  const [thongBao, datThongBao] = useState<string | null>(null);
  const [dangLuu, batDauLuu]    = useTransition();

  function luuThayDoi() {
    datThongBao(null);
    batDauLuu(async () => {
      const ketQua = await guiSuaBanNhap({ contentId: banNhap.id, noiDung });
      datThongBao(ketQua.ok ? 'Đã lưu thay đổi.' : ketQua.loi);
    });
  }

  return (
    <div className="chi-tiet-ban-nhap">
      <section className="panel chi-tiet-ban-nhap__noi-dung">
        <p className="bien-soan-buoc">01 · Nội dung bài đăng</p>
        <h2>Chỉnh sửa bản nháp</h2>
        <div className="chi-tiet-ban-nhap__y-tuong">
          <span>Tên ý tưởng</span>
          <strong>{banNhap.tieuDeYTuong ?? 'Ý tưởng gốc không còn tồn tại'}</strong>
        </div>
        <textarea
          aria-label="Nội dung bản nháp"
          value={noiDung}
          onChange={(suKien) => datNoiDung(suKien.target.value)}
          rows={18}
        />
        <div className="chi-tiet-ban-nhap__hanh-dong">
          <button className="btn" type="button" disabled={dangLuu} onClick={luuThayDoi}>
            {dangLuu ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
          {thongBao ? <span role="status">{thongBao}</span> : null}
        </div>
      </section>

      <XemAnh contentId={banNhap.id} anhBanDau={anhBanDau} />
    </div>
  );
}
