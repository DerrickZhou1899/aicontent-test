'use client';

import { useMemo, useState, useTransition } from 'react';

import { Icon } from '../../sprite-icon';
import { bocPhuDeVideo } from '../cai-dat/kenh/actions';

export type AnhBai = { id: string; duongDan: string | null; urlNgoai: string | null };
export type VideoBai = { id: string; urlNgoai: string | null; phuDe: string | null };

export type DongBai = {
  id: string;
  ngayDang: string | null;
  noiDung: string;
  soKyTu: number;
  lienKetGoc: string | null;
  dangBai: string | null;
  soThich: number | null;
  soBinhLuan: number | null;
  soChiaSe: number | null;
  thoiLuongVideoMs: number | null;
  anh: AnhBai[];
  video: VideoBai[];
};

/** Bo loc dang go cho tung cot. Chuoi rong = khong loc. */
type BoLoc = {
  ngay: string;
  dang: string;
  noiDung: string;
  kyTu: string;
  anh: string;
  video: string;
  thoiLuong: string;
  thich: string;
  binhLuan: string;
  chiaSe: string;
  phuDe: string;
};

const LOC_RONG: BoLoc = {
  ngay: '', dang: '', noiDung: '', kyTu: '', anh: '', video: '',
  thoiLuong: '', thich: '', binhLuan: '', chiaSe: '', phuDe: '',
};

type Cot = keyof BoLoc;

function ngayViet(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function giay(ms: number | null): string {
  if (ms === null) return '—';
  const t = Math.round(ms / 1000);
  return t >= 60 ? `${Math.floor(t / 60)}p${String(t % 60).padStart(2, '0')}` : `${t}s`;
}

/** `null` hien dau gach, khong hien 0 — khong do duoc khac han do duoc va bang 0. */
function so(v: number | null): string {
  return v === null ? '—' : String(v);
}

/**
 * So khop mot o loc voi mot con so.
 *
 * Chap nhan ba dang: `12` (bang), `>12` / `<12` (so sanh). Nguoi dung go so
 * tran la truong hop hay gap nhat nen no phai la mac dinh, khong bat hoc cu phap.
 */
function khopSo(loc: string, giaTri: number | null): boolean {
  const sach = loc.trim();
  if (sach === '') return true;
  if (giaTri === null) return false;

  const dau = sach[0];
  if (dau === '>' || dau === '<') {
    const nguong = Number(sach.slice(1).trim());
    if (Number.isNaN(nguong)) return true;
    return dau === '>' ? giaTri > nguong : giaTri < nguong;
  }
  const n = Number(sach);
  return Number.isNaN(n) ? true : giaTri === n;
}

function khopChu(loc: string, giaTri: string): boolean {
  const sach = loc.trim().toLowerCase();
  return sach === '' || giaTri.toLowerCase().includes(sach);
}

export function BangBaiDaDang({ dong }: { dong: DongBai[] }) {
  const [loc, datLoc] = useState<BoLoc>(LOC_RONG);
  const [moRong, datMoRong] = useState<string | null>(null);
  const [phuDeMoi, datPhuDeMoi] = useState<Record<string, string>>({});
  const [loi, datLoi] = useState<Record<string, string>>({});
  const [dangChay, batDau] = useTransition();

  const hien = useMemo(
    () =>
      dong.filter(
        (b) =>
          khopChu(loc.ngay, ngayViet(b.ngayDang)) &&
          khopChu(loc.dang, b.dangBai === 'kich_ban_quay' ? 'video' : 'chữ') &&
          khopChu(loc.noiDung, b.noiDung) &&
          khopSo(loc.kyTu, b.soKyTu) &&
          khopSo(loc.anh, b.anh.length) &&
          khopSo(loc.video, b.video.length) &&
          khopSo(loc.thoiLuong, b.thoiLuongVideoMs === null ? null : Math.round(b.thoiLuongVideoMs / 1000)) &&
          khopSo(loc.thich, b.soThich) &&
          khopSo(loc.binhLuan, b.soBinhLuan) &&
          khopSo(loc.chiaSe, b.soChiaSe) &&
          khopChu(loc.phuDe, b.video.some((v) => v.phuDe || phuDeMoi[v.id]) ? 'có' : 'không'),
      ),
    [dong, loc, phuDeMoi],
  );

  if (dong.length === 0) {
    return (
      <p className="o__goi-y">
        Chưa có bài nào. <a href="/cai-dat/kenh">Dán liên kết kênh</a> rồi kéo bài về.
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
      </div>

      <div className="bang-cuon">
        <table className="bang">
          <thead>
            <tr>
              <th className="bang__c-ngay">Ngày</th>
              <th className="bang__c-dang">Dạng</th>
              <th className="bang__c-noi-dung">Nội dung</th>
              <th className="bang__c-so">Ký tự</th>
              <th className="bang__c-so">Ảnh</th>
              <th className="bang__c-so">Video</th>
              <th className="bang__c-so">Thời lượng</th>
              <th className="bang__c-so">Thích</th>
              <th className="bang__c-so">Bình luận</th>
              <th className="bang__c-so">Chia sẻ</th>
              <th className="bang__c-phu-de">Phụ đề</th>
              <th className="bang__c-link">Gốc</th>
            </tr>
            <tr className="bang__hang-loc">
              <td>{oLoc('ngay', 'ngày')}</td>
              <td>{oLoc('dang', 'chữ/video')}</td>
              <td>{oLoc('noiDung', 'tìm trong bài')}</td>
              <td>{oLoc('kyTu', '>500')}</td>
              <td>{oLoc('anh', '>0')}</td>
              <td>{oLoc('video', '>0')}</td>
              <td>{oLoc('thoiLuong', 'giây')}</td>
              <td>{oLoc('thich', '>50')}</td>
              <td>{oLoc('binhLuan', '>0')}</td>
              <td>{oLoc('chiaSe', '>0')}</td>
              <td>{oLoc('phuDe', 'có/không')}</td>
              <td />
            </tr>
          </thead>

          <tbody>
            {hien.map((b) => {
              const mo = moRong === b.id;
              const coPhuDe = b.video.some((v) => v.phuDe || phuDeMoi[v.id]);
              return (
                <tr key={b.id} className={mo ? 'bang__hang--mo' : ''}>
                  <td className="bang__c-ngay">{ngayViet(b.ngayDang)}</td>
                  <td className="bang__c-dang">
                    {b.dangBai === 'kich_ban_quay' ? 'Video' : 'Chữ'}
                  </td>
                  <td className="bang__c-noi-dung">
                    <button
                      type="button"
                      className={`bang__chu ${mo ? '' : 'bang__chu--gon'}`}
                      onClick={() => datMoRong(mo ? null : b.id)}
                      title={mo ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {b.noiDung || '(bài không có chữ)'}
                    </button>

                    {mo ? (
                      <div className="bang__mo-rong">
                        {b.anh.length ? (
                          <div className="bai-anh">
                            {b.anh.map((a) => (
                              <img
                                key={a.id}
                                src={a.duongDan ? `/api/media/${a.duongDan}` : (a.urlNgoai ?? '')}
                                alt=""
                                loading="lazy"
                              />
                            ))}
                          </div>
                        ) : null}

                        {b.video.map((v) => (
                          <div className="bai-video" key={v.id}>
                            <div className="muc__nut">
                              {v.urlNgoai ? (
                                <a
                                  className="btn btn--ghost btn--sm"
                                  href={v.urlNgoai}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  Mở video ↗
                                </a>
                              ) : null}
                              {v.phuDe || phuDeMoi[v.id] ? null : (
                                <button
                                  className="btn btn--ghost btn--sm"
                                  type="button"
                                  disabled={dangChay}
                                  onClick={() =>
                                    batDau(async () => {
                                      const kq = await bocPhuDeVideo(v.id);
                                      if (!kq.ok) {
                                        datLoi((cu) => ({ ...cu, [v.id]: kq.loi }));
                                        return;
                                      }
                                      datPhuDeMoi((cu) => ({ ...cu, [v.id]: kq.phuDe }));
                                    })
                                  }
                                >
                                  {dangChay ? 'Đang bóc…' : 'Bóc phụ đề'}
                                </button>
                              )}
                            </div>
                            {v.phuDe || phuDeMoi[v.id] ? (
                              <p className="bai-video__phu-de">{v.phuDe ?? phuDeMoi[v.id]}</p>
                            ) : null}
                            {loi[v.id] ? <p className="o__goi-y">{loi[v.id]}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="bang__c-so">{b.soKyTu}</td>
                  <td className="bang__c-so">{b.anh.length || '—'}</td>
                  <td className="bang__c-so">{b.video.length || '—'}</td>
                  <td className="bang__c-so">{giay(b.thoiLuongVideoMs)}</td>
                  <td className="bang__c-so">{so(b.soThich)}</td>
                  <td className="bang__c-so">{so(b.soBinhLuan)}</td>
                  <td className="bang__c-so">{so(b.soChiaSe)}</td>
                  <td className="bang__c-phu-de">
                    {b.video.length === 0 ? '—' : coPhuDe ? 'Có' : 'Chưa'}
                  </td>
                  <td className="bang__c-link">
                    {b.lienKetGoc ? (
                      <a href={b.lienKetGoc} target="_blank" rel="noreferrer noopener">
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
