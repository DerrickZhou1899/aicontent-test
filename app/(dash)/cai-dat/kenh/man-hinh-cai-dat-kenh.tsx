'use client';

import { useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { keoBaiVe, luuKenhCaNhan } from './actions';
import type { KetQuaLuot } from '@/lib/keo-bai/luu-bai-keo-ve';

/**
 * Man cai dat kenh.
 *
 * Hai viec, co thu tu: luu lien ket kenh truoc, roi moi keo duoc. Nut keo bi
 * khoa khi chua co kenh de nguoi dung khong bam vao mot luot chay chac chan hong.
 */
export function ManHinhCaiDatKenh({ urlKenh }: { urlKenh: string | null }) {
  const [url, datUrl] = useState(urlKenh ?? '');
  const [daLuu, datDaLuu] = useState(urlKenh);
  const [soBai, datSoBai] = useState(10);
  const [loi, datLoi] = useState<string | null>(null);
  const [ket, datKet] = useState<KetQuaLuot | null>(null);
  const [dangChay, batDau] = useTransition();

  return (
    <div className="dan">
      <div className="bieu-mau">
        <div className="o">
          <label className="o__nhan" htmlFor="o-url-kenh">
            Liên kết trang cá nhân Facebook
          </label>
          <p className="o__goi-y">
            Dán nguyên địa chỉ trang cá nhân, ví dụ https://www.facebook.com/DangSangVN
          </p>
          <input
            type="text"
            id="o-url-kenh"
            value={url}
            placeholder="https://www.facebook.com/..."
            onChange={(e) => datUrl(e.target.value)}
          />
        </div>

        <div className="bieu-mau__nut">
          <button
            className="btn btn--primary"
            type="button"
            disabled={dangChay || url.trim() === ''}
            onClick={() =>
              batDau(async () => {
                datLoi(null);
                const kq = await luuKenhCaNhan(url);
                if (!kq.ok) {
                  datLoi(kq.loi);
                  return;
                }
                datUrl(kq.urlKenh);
                datDaLuu(kq.urlKenh);
              })
            }
          >
            <Icon name="i-check" size={17} />
            Lưu liên kết
          </button>
          {daLuu ? <span className="ghi-chu-mo-hinh">đang theo: {daLuu}</span> : null}
        </div>
      </div>

      <div className="bieu-mau">
        <div className="o">
          <label className="o__nhan" htmlFor="o-so-bai-keo">
            Số bài kéo về
          </label>
          <p className="o__goi-y">
            Mỗi lượt kéo là một lần tính tiền Apify. Bài đã kéo rồi thì lượt sau bỏ qua, không
            kéo lại và không tạo bản trùng.
          </p>
          <input
            type="text"
            id="o-so-bai-keo"
            inputMode="numeric"
            value={soBai}
            onChange={(e) =>
              datSoBai(Math.min(Number(e.target.value.replace(/\D/g, '')) || 0, 30))
            }
          />
        </div>

        <div className="bieu-mau__nut">
          <button
            className="btn btn--primary"
            type="button"
            disabled={dangChay || !daLuu || soBai < 1}
            onClick={() =>
              batDau(async () => {
                datLoi(null);
                datKet(null);
                const kq = await keoBaiVe(soBai);
                if (!kq.ok) {
                  datLoi(kq.loi);
                  return;
                }
                datKet(kq.ket);
              })
            }
          >
            <Icon name="i-trend" size={17} />
            {dangChay ? 'Đang kéo…' : `Kéo ${soBai} bài về`}
          </button>
          <span className="ghi-chu-mo-hinh">10 bài mất khoảng 30 giây</span>
        </div>
      </div>

      {loi ? (
        <div className="chan chan--chan" role="alert">
          <p className="chan__tieu-de">
            <Icon name="i-alert" size={17} />
            Chưa kéo được
          </p>
          <p className="chan__sub">{loi}</p>
        </div>
      ) : null}

      {ket ? (
        <div className="chan">
          <p className="chan__tieu-de">
            <Icon name="i-check" size={17} />
            Kéo xong
          </p>
          <ul className="chan__thieu">
            <li>
              <span className="chan__trong-so">{ket.soBaiMoi}</span>
              <span>bài mới lưu vào kho</span>
            </li>
            <li>
              <span className="chan__trong-so">{ket.soDaCo}</span>
              <span>bài đã có từ trước, bỏ qua</span>
            </li>
            <li>
              <span className="chan__trong-so">{ket.soAnhLuu}</span>
              <span>ảnh tải về đĩa{ket.soAnhHong ? ` (${ket.soAnhHong} ảnh hỏng)` : ''}</span>
            </li>
            {ket.soAnhVaLai ? (
              <li>
                <span className="chan__trong-so">{ket.soAnhVaLai}</span>
                <span>ảnh hỏng của lượt trước đã tải lại được</span>
              </li>
            ) : null}
            {ket.soSoLieuCapNhat ? (
              <li>
                <span className="chan__trong-so">{ket.soSoLieuCapNhat}</span>
                <span>bài được cập nhật lại số liệu</span>
              </li>
            ) : null}
            <li>
              <span className="chan__trong-so">{ket.soVideo}</span>
              <span>video — bấm vào bài để bóc phụ đề</span>
            </li>
          </ul>
          <a className="btn btn--primary btn--sm" href="/bai-da-dang">
            Xem bài đã kéo
          </a>
        </div>
      ) : null}
    </div>
  );
}
