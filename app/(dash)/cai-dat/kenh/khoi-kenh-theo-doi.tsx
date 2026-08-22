'use client';

import { useState, useTransition } from 'react';

import { BangKenhTheoDoi, KetQuaKeo } from './bang-kenh-theo-doi';
import { Icon } from '../../../sprite-icon';
import {
  datTheoDoi,
  keoKenhTheoDoiNgay,
  themKenhTheoDoi,
  tatKenhTheoDoi,
} from './actions';
import type { BeMatTheoDoi, KenhKemTheoDoi } from '@/lib/data-access/kenh-theo-doi';
import type { KetQuaLuotTheoDoi } from '@/lib/keo-bai/keo-kenh-theo-doi';

/**
 * Khoi "kenh theo doi" — kenh cua NGUOI KHAC.
 *
 * Tep rieng chu khong nhet vao `man-hinh-cai-dat-kenh.tsx`: tep do da 165 dong
 * va dang chay tot, khong co ly do gi de dung vao no ngoai mot dong noi.
 *
 * Phan HIEN cua bang nam o `bang-kenh-theo-doi.tsx`; file nay giu trang thai va
 * moi lan goi may chu.
 */

const BE_MAT: { ma: BeMatTheoDoi; ten: string; goiY: string }[] = [
  { ma: 'fanpage', ten: 'Fanpage', goiY: 'https://www.facebook.com/tenfanpage' },
  { ma: 'tiktok', ten: 'TikTok', goiY: 'https://www.tiktok.com/@tenkenh' },
  { ma: 'ho_so_ca_nhan', ten: 'Hồ sơ cá nhân', goiY: 'https://www.facebook.com/tennguoi' },
];

export function KhoiKenhTheoDoi({ kenh }: { kenh: KenhKemTheoDoi[] }) {
  const [beMat, datBeMat] = useState<BeMatTheoDoi>('fanpage');
  const [url, datUrl] = useState('');
  const [loi, datLoi] = useState<string | null>(null);
  const [ket, datKet] = useState<KetQuaLuotTheoDoi[] | null>(null);
  const [dangChay, batDau] = useTransition();

  const goiY = BE_MAT.find((b) => b.ma === beMat)?.goiY ?? '';
  const soToiTheoDoi = kenh.filter((k) => k.toiTheoDoi && k.dangHoatDong).length;

  return (
    <div className="dan">
      <div className="bieu-mau">
        <div className="o">
          <label className="o__nhan" htmlFor="o-url-theo-doi">
            Thêm kênh của người khác để theo dõi
          </label>
          <p className="o__goi-y">
            Kênh và bài kéo về dùng chung cho cả nhóm — hai người cùng theo một kênh vẫn chỉ
            tốn một lượt kéo. Riêng ô “tôi theo dõi” thì chỉ của bạn.
          </p>

          <div className="bieu-mau__nut" style={{ marginBottom: 10 }}>
            {BE_MAT.map((b) => (
              <button
                key={b.ma}
                type="button"
                className={`btn btn--sm ${beMat === b.ma ? 'btn--primary' : ''}`}
                onClick={() => datBeMat(b.ma)}
              >
                {b.ten}
              </button>
            ))}
          </div>

          <input
            type="text"
            id="o-url-theo-doi"
            value={url}
            placeholder={goiY}
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
                const kq = await themKenhTheoDoi(beMat, url);
                if (!kq.ok) {
                  datLoi(kq.loi);
                  return;
                }
                datUrl('');
              })
            }
          >
            <Icon name="i-check" size={17} />
            Thêm kênh
          </button>
          <span className="ghi-chu-mo-hinh">
            Thêm xong là bạn theo dõi kênh đó luôn
          </span>
        </div>
      </div>

      <BangKenhTheoDoi
        kenh={kenh}
        dangChay={dangChay}
        onDatTheoDoi={(kenhId, bat) => batDau(async () => { await datTheoDoi(kenhId, bat); })}
        onTatKenh={(k) => {
          // Tat anh huong CA NHOM nen hoi xac nhan khi con nguoi khac dang theo.
          if (
            k.dangHoatDong &&
            k.soNguoiTheoDoi > 1 &&
            !window.confirm(
              `${k.soNguoiTheoDoi} người đang theo dõi kênh này. Tắt là cả nhóm ngừng kéo. Vẫn tắt?`,
            )
          ) {
            return;
          }
          batDau(async () => { await tatKenhTheoDoi(k.id, !k.dangHoatDong); });
        }}
      />

      {kenh.length > 0 ? (
        <div className="bieu-mau__nut">
          <button
            className="btn btn--primary"
            type="button"
            disabled={dangChay || soToiTheoDoi === 0}
            onClick={() =>
              batDau(async () => {
                datLoi(null);
                datKet(null);
                const kq = await keoKenhTheoDoiNgay();
                if (!kq.ok) {
                  datLoi(kq.loi);
                  return;
                }
                datKet(kq.ket);
              })
            }
          >
            <Icon name="i-trend" size={17} />
            {dangChay ? 'Đang kéo…' : 'Kéo bài của các kênh này'}
          </button>
          <a className="btn btn--ghost" href="/kenh-ngoai">
            <Icon name="i-file" size={17} />
            Xem bài đã kéo
          </a>
          <span className="ghi-chu-mo-hinh">
            Mỗi lượt là một lần tính tiền Apify. Bài đã có thì bỏ qua.
          </span>
        </div>
      ) : null}

      {loi ? (
        <div className="chan chan--chan" role="alert">
          <p className="chan__tieu-de">
            <Icon name="i-alert" size={17} />
            Chưa làm được
          </p>
          <p className="chan__sub">{loi}</p>
        </div>
      ) : null}

      {ket ? ket.map((k, i) => <KetQuaKeo key={i} ket={k} />) : null}
    </div>
  );
}
