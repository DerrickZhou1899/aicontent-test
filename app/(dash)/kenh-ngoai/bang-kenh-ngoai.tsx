'use client';

import { useMemo, useState } from 'react';

import { Icon } from '../../sprite-icon';
import { giay, khopChu, khopSo, ngayViet, so, tenDang, TRAN_BAI } from './dinh-dang-va-loc';

/**
 * Bang bai keo ve tu kenh NGUOI KHAC.
 *
 * Dung khuon cua `bai-da-dang/bang-bai-da-dang.tsx`.
 *
 * Bang nay KHONG co anh/video/phu de: `trend_signals` chi luu chu va so lieu,
 * bo boc kenh ngoai khong luu dong asset nao (`lib/keo-bai/keo-kenh-theo-doi.ts`).
 * Bu lai co cot "Kenh" vi mot bang gom bai cua nhieu kenh.
 */

export type DongKenhNgoai = {
  id: string;
  thoiDiem: string | null;
  tenKenh: string;
  urlKenh: string;
  noiDung: string;
  soKyTu: number;
  dangBai: string | null;
  lienKet: string | null;
  soThich: number | null;
  soBinhLuan: number | null;
  soChiaSe: number | null;
  thoiLuongVideoMs: number | null;
};

/** Bo loc dang go cho tung cot. Chuoi rong = khong loc. */
type BoLoc = {
  ngay: string;
  kenh: string;
  dang: string;
  noiDung: string;
  kyTu: string;
  thoiLuong: string;
  thich: string;
  binhLuan: string;
  chiaSe: string;
};

const LOC_RONG: BoLoc = {
  ngay: '', kenh: '', dang: '', noiDung: '', kyTu: '',
  thoiLuong: '', thich: '', binhLuan: '', chiaSe: '',
};

type Cot = keyof BoLoc;

export function BangKenhNgoai({ dong }: { dong: DongKenhNgoai[] }) {
  const [loc, datLoc] = useState<BoLoc>(LOC_RONG);
  const [moRong, datMoRong] = useState<string | null>(null);

  const hien = useMemo(
    () =>
      dong.filter(
        (b) =>
          khopChu(loc.ngay, ngayViet(b.thoiDiem)) &&
          khopChu(loc.kenh, b.tenKenh) &&
          khopChu(loc.dang, tenDang(b.dangBai)) &&
          khopChu(loc.noiDung, b.noiDung) &&
          khopSo(loc.kyTu, b.soKyTu) &&
          khopSo(loc.thoiLuong, b.thoiLuongVideoMs === null ? null : Math.round(b.thoiLuongVideoMs / 1000)) &&
          khopSo(loc.thich, b.soThich) &&
          khopSo(loc.binhLuan, b.soBinhLuan) &&
          khopSo(loc.chiaSe, b.soChiaSe),
      ),
    [dong, loc],
  );

  if (dong.length === 0) {
    return (
      <p className="o__goi-y">
        Chưa có bài nào từ kênh bạn theo dõi.{' '}
        <a href="/cai-dat/kenh">Thêm kênh ngoài kia</a> rồi kéo dữ liệu về.
      </p>
    );
  }

  const oLoc = (cot: Cot, goiY: string) => (
    <input
      className="bang__loc"
      type="text"
      value={loc[cot]}
      placeholder={goiY}
      aria-label={`Lọc cột ${cot}`}
      onChange={(e) => datLoc((cu) => ({ ...cu, [cot]: e.target.value }))}
    />
  );

  const coLoc = Object.values(loc).some((v) => v.trim() !== '');

  return (
    <>
      <div className="bang__dau">
        <p className="ghi-chu-mo-hinh">
          {hien.length}/{dong.length} bài
          {coLoc ? ' (đang lọc)' : ''}
        </p>
        {coLoc ? (
          <button className="btn btn--ghost btn--sm" type="button" onClick={() => datLoc(LOC_RONG)}>
            Bỏ lọc
          </button>
        ) : null}
        <span className="ghi-chu-mo-hinh">
          Ô lọc số nhận <code>12</code>, <code>&gt;12</code>, <code>&lt;12</code>
        </span>
        {/* Cham tran thi phai noi ro: bo loc chi loc trong so bai DA TAI, go
            mot dieu kien roi khong thay gi de bi hieu la "kho khong co bai do". */}
        {dong.length >= TRAN_BAI ? (
          <span className="ghi-chu-mo-hinh">
            Chỉ tải {TRAN_BAI} bài mới nhất — bộ lọc tìm trong số này
          </span>
        ) : null}
      </div>

      <div className="bang-cuon">
        <table className="bang">
          <thead>
            <tr>
              <th className="bang__c-ngay">Ngày</th>
              <th className="bang__c-kenh">Kênh</th>
              <th className="bang__c-dang">Dạng</th>
              <th className="bang__c-noi-dung">Nội dung</th>
              <th className="bang__c-so">Ký tự</th>
              <th className="bang__c-so">Thời lượng</th>
              <th className="bang__c-so">Thích</th>
              <th className="bang__c-so">Bình luận</th>
              <th className="bang__c-so">Chia sẻ</th>
              <th className="bang__c-link">Gốc</th>
            </tr>
            <tr className="bang__hang-loc">
              <td>{oLoc('ngay', 'ngày')}</td>
              <td>{oLoc('kenh', 'tên kênh')}</td>
              <td>{oLoc('dang', 'chữ/ảnh/video')}</td>
              <td>{oLoc('noiDung', 'tìm trong bài')}</td>
              <td>{oLoc('kyTu', '>500')}</td>
              <td>{oLoc('thoiLuong', 'giây')}</td>
              <td>{oLoc('thich', '>50')}</td>
              <td>{oLoc('binhLuan', '>0')}</td>
              <td>{oLoc('chiaSe', '>0')}</td>
              <td />
            </tr>
          </thead>

          <tbody>
            {hien.map((b) => {
              const mo = moRong === b.id;
              return (
                <tr key={b.id} className={mo ? 'bang__hang--mo' : ''}>
                  <td className="bang__c-ngay">{ngayViet(b.thoiDiem)}</td>
                  <td className="bang__c-kenh" title={b.tenKenh}>
                    <a href={b.urlKenh} target="_blank" rel="noreferrer noopener">
                      {b.tenKenh}
                    </a>
                  </td>
                  <td className="bang__c-dang">{tenDang(b.dangBai)}</td>
                  <td className="bang__c-noi-dung">
                    <button
                      type="button"
                      className={`bang__chu ${mo ? '' : 'bang__chu--gon'}`}
                      onClick={() => datMoRong(mo ? null : b.id)}
                      title={mo ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {b.noiDung || '(bài không có chữ)'}
                    </button>
                  </td>
                  <td className="bang__c-so">{b.soKyTu}</td>
                  <td className="bang__c-so">{giay(b.thoiLuongVideoMs)}</td>
                  <td className="bang__c-so">{so(b.soThich)}</td>
                  <td className="bang__c-so">{so(b.soBinhLuan)}</td>
                  <td className="bang__c-so">{so(b.soChiaSe)}</td>
                  <td className="bang__c-link">
                    {b.lienKet ? (
                      <a href={b.lienKet} target="_blank" rel="noreferrer noopener">
                        Mở ↗
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hien.length === 0 ? (
        <p className="o__goi-y">
          Không bài nào khớp bộ lọc. <Icon name="i-search" size={14} />
        </p>
      ) : null}
    </>
  );
}
