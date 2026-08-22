'use client';

import { Icon } from '../../../sprite-icon';
import type { KenhKemTheoDoi } from '@/lib/data-access/kenh-theo-doi';

/**
 * Bang liet ke kenh dang theo doi.
 *
 * Tach khoi `khoi-kenh-theo-doi.tsx` de tep do ve duoi 200 dong (quy uoc du an).
 * Ranh gioi tach dung nghia: file nay chi HIEN, moi quyet dinh va moi lan goi
 * may chu deu o file kia va di vao qua props.
 *
 * BA DIEU BANG NAY PHAI NOI RO, vi khong noi thi nguoi dung hieu sai:
 *  1. Kho kenh la CUA CHUNG nhom, con o "toi theo doi" la RIENG tung nguoi.
 *  2. Kenh khong ai theo doi thi KHONG BAO GIO duoc keo — phai hien ra, neu
 *     khong ai cung tuong no dang chay.
 *  3. "Tat" anh huong ca nhom nen phai hoi xac nhan.
 */

const TEN_BE_MAT: Record<string, string> = {
  fanpage: 'Fanpage',
  tiktok: 'TikTok',
  ho_so_ca_nhan: 'Hồ sơ cá nhân',
  zalo: 'Zalo',
};

export function tenKenhTuUrl(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/+|\/+$/g, '') || url;
  } catch {
    return url;
  }
}

function moTaLanKeo(lanKeoCuoi: Date | string | null): string {
  if (!lanKeoCuoi) return 'chưa kéo lần nào';
  const moc = new Date(lanKeoCuoi);
  const gio = Math.floor((Date.now() - moc.getTime()) / 3_600_000);
  if (gio < 1) return 'vừa kéo xong';
  if (gio < 24) return `${gio} giờ trước`;
  return `${Math.floor(gio / 24)} ngày trước`;
}

export function BangKenhTheoDoi({
  kenh,
  dangChay,
  onDatTheoDoi,
  onTatKenh,
}: {
  kenh: KenhKemTheoDoi[];
  dangChay: boolean;
  onDatTheoDoi: (kenhId: string, bat: boolean) => void;
  onTatKenh: (kenh: KenhKemTheoDoi) => void;
}) {
  if (kenh.length === 0) {
    return <p className="ghi-chu-mo-hinh">Chưa theo dõi kênh nào.</p>;
  }

  return (
    <div className="bang-cuon">
      <table className="bang">
        <thead>
          <tr>
            <th scope="col">Kênh</th>
            <th scope="col">Bề mặt</th>
            <th scope="col">Tôi theo dõi</th>
            <th scope="col">Kéo lần cuối</th>
            <th scope="col">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {kenh.map((k) => (
            <tr key={k.id} className={k.dangHoatDong ? undefined : 'bang__hang--mo'}>
              <td>
                <a href={k.urlKenh} target="_blank" rel="noreferrer noopener">
                  {k.tenHienThi ?? tenKenhTuUrl(k.urlKenh)}
                </a>
                {k.soNguoiTheoDoi === 0 ? (
                  <span className="ghi-chu-mo-hinh"> — chưa ai theo dõi, sẽ không kéo</span>
                ) : null}
                {!k.dangHoatDong ? <span className="ghi-chu-mo-hinh"> — đã tắt</span> : null}
              </td>
              <td>{TEN_BE_MAT[k.beMat] ?? k.beMat}</td>
              <td>
                <input
                  type="checkbox"
                  checked={k.toiTheoDoi}
                  disabled={dangChay}
                  aria-label={`Tôi theo dõi ${tenKenhTuUrl(k.urlKenh)}`}
                  onChange={(e) => onDatTheoDoi(k.id, e.target.checked)}
                />
              </td>
              <td>{moTaLanKeo(k.lanKeoCuoi)}</td>
              <td>
                <button
                  type="button"
                  className="btn btn--sm"
                  disabled={dangChay}
                  onClick={() => onTatKenh(k)}
                >
                  {k.dangHoatDong ? 'Tắt' : 'Bật lại'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KetQuaKeo({ ket }: { ket: import('@/lib/keo-bai/keo-kenh-theo-doi').KetQuaLuotTheoDoi }) {
  return (
    <div className={ket.boLuot ? 'chan chan--chan' : 'chan'}>
      <p className="chan__tieu-de">
        <Icon name={ket.boLuot ? 'i-alert' : 'i-check'} size={17} />
        {ket.boLuot ? 'Bỏ lượt kéo' : 'Kéo xong'}
      </p>
      {ket.boLuot ? (
        <p className="chan__sub">{ket.lyDoBoLuot}</p>
      ) : (
        <ul className="chan__thieu">
          <li>
            <span className="chan__trong-so">{ket.soBaiMoi}</span>
            <span>bài mới lưu vào kho</span>
          </li>
          <li>
            <span className="chan__trong-so">{ket.soKenhKeo}</span>
            <span>kênh đã kéo</span>
          </li>
          <li>
            <span className="chan__trong-so">
              {ket.chiPhiUsd !== null ? `$${ket.chiPhiUsd.toFixed(3)}` : '—'}
            </span>
            <span>chi phí thật của lượt này</span>
          </li>
        </ul>
      )}
      {ket.canhBao.map((c, j) => (
        <p key={j} className="chan__sub">
          {c}
        </p>
      ))}
      {!ket.boLuot && ket.soBaiMoi > 0 ? (
        <div className="bieu-mau__nut">
          <a className="btn btn--primary btn--sm" href="/studio/de-xuat">
            Sinh ý tưởng từ các bài này
          </a>
          <a className="btn btn--ghost btn--sm" href="/kenh-ngoai">
            Xem bài vừa kéo
          </a>
        </div>
      ) : null}
    </div>
  );
}
