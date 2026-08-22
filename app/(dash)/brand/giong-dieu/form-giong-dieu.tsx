'use client';

import { useState, useTransition } from 'react';

import { luuGiongDieu } from '../actions';
import { TRONG_SO } from '@/lib/brand/do-day-du';

type HoSo = {
  moTa: string | null;
  giongDieu: string | null;
  dieuCamKy: string | null;
  phongChu: string | null;
};

/** Nguong ky tu de nhom `giongDieu` duoc tinh la da co — xem lib/brand/do-day-du.ts. */
const TOI_THIEU_GIONG_DIEU = 100;

export function FormGiongDieu({ hoSo }: { hoSo: HoSo }) {
  const [giongDieu, datGiongDieu] = useState(hoSo.giongDieu ?? '');
  const [xong, datXong] = useState(false);
  const [dangChay, batDau] = useTransition();

  const daDu = giongDieu.trim().length >= TOI_THIEU_GIONG_DIEU;

  return (
    <form
      className="bieu-mau"
      action={(form) => {
        datXong(false);
        batDau(async () => {
          await luuGiongDieu(form);
          datXong(true);
        });
      }}
    >
      <div className="o">
        <label className="o__nhan" htmlFor="o-moTa">
          Mô tả thương hiệu
        </label>
        <p className="o__goi-y">Kênh này là ai, làm gì, khác gì chỗ khác.</p>
        <textarea id="o-moTa" name="moTa" defaultValue={hoSo.moTa ?? ''} />
      </div>

      <div className="o">
        <label className="o__nhan" htmlFor="o-giongDieu">
          Giọng điệu <span className="o__bat-buoc">*</span>
        </label>
        <p className="o__goi-y">
          Cách kênh nói chuyện. Cần từ {TOI_THIEU_GIONG_DIEU} ký tự thì nhóm này mới được tính
          vào độ đầy đủ ({TRONG_SO.giongDieu}%) — mô tả càng cụ thể thì bài viết càng ít nhạt.
        </p>
        <textarea
          id="o-giongDieu"
          name="giongDieu"
          value={giongDieu}
          onChange={(e) => datGiongDieu(e.target.value)}
        />
        <p className="o__goi-y" aria-live="polite">
          {giongDieu.trim().length}/{TOI_THIEU_GIONG_DIEU} ký tự{daDu ? ' — đã đủ' : ''}
        </p>
      </div>

      <div className="o">
        <label className="o__nhan" htmlFor="o-dieuCamKy">
          Điều cấm kỵ <span className="o__bat-buoc">*</span>
        </label>
        <p className="o__goi-y">
          Thứ tuyệt đối không được viết. Mỗi dòng một điều. Đây là chỗ chặn hệ thống viết ra
          câu làm hỏng uy tín kênh.
        </p>
        <textarea id="o-dieuCamKy" name="dieuCamKy" defaultValue={hoSo.dieuCamKy ?? ''} />
      </div>

      <div className="o">
        <label className="o__nhan" htmlFor="o-phongChu">
          Phông chữ
        </label>
        <input
          type="text"
          id="o-phongChu"
          name="phongChu"
          defaultValue={hoSo.phongChu ?? ''}
        />
      </div>

      <div className="bieu-mau__nut">
        <button className="btn btn--primary" type="submit" disabled={dangChay}>
          {dangChay ? 'Đang lưu…' : 'Lưu hồ sơ'}
        </button>
        {xong && !dangChay ? (
          <span className="ghi-chu-mo-hinh" role="status">
            Đã lưu.
          </span>
        ) : null}
      </div>
    </form>
  );
}
