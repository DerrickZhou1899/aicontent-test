'use client';

import { useEffect, useState, useTransition } from 'react';

import type { AnhDaSinh } from '@/lib/studio/sinh-anh';

import { guiDocAnh, guiSinhAnh } from './actions';

const NHAN_TRANG_THAI: Record<string, string> = {
  cho       : 'Chờ xử lý',
  dang_chay : 'Đang xử lý',
  xong      : 'Hoàn tất',
  loi       : 'Có lỗi',
  huy       : 'Đã hủy',
};

function nhanTrangThai(trangThai: string): string {
  return NHAN_TRANG_THAI[trangThai] ?? 'Không xác định';
}

function urlMedia(duongDan: string): string {
  return `/api/media/${duongDan.split('/').map(encodeURIComponent).join('/')}`;
}

export function XemAnh({ contentId }: { contentId: string }) {
  const [jobId, datJobId]           = useState<string | null>(null);
  const [trangThai, datTrangThai]   = useState<string | null>(null);
  const [anh, datAnh]               = useState<AnhDaSinh | null>(null);
  const [loi, datLoi]               = useState<string | null>(null);
  const [dangGui, batDauGui]        = useTransition();

  useEffect(() => {
    if (!jobId || anh || loi) return;
    let daDung = false;
    let dongHo: ReturnType<typeof setTimeout>;

    async function hoiTrangThai() {
      const ketQua = await guiDocAnh(jobId!);
      if (daDung) return;
      if (!ketQua.ok) {
        datLoi(ketQua.loi);
        return;
      }

      datTrangThai(ketQua.duLieu.trangThai);
      if (ketQua.duLieu.anh) {
        datAnh(ketQua.duLieu.anh);
        return;
      }
      if (ketQua.duLieu.loi) {
        datLoi(ketQua.duLieu.loi);
        return;
      }
      dongHo = setTimeout(hoiTrangThai, 2000);
    }

    dongHo = setTimeout(hoiTrangThai, 2000);
    return () => {
      daDung = true;
      clearTimeout(dongHo);
    };
  }, [anh, jobId, loi]);

  function batDauSinh() {
    datLoi(null);
    datAnh(null);
    batDauGui(async () => {
      const ketQua = await guiSinhAnh(contentId);
      if (!ketQua.ok) {
        datLoi(ketQua.loi);
        return;
      }
      datJobId(ketQua.duLieu.jobId);
      datTrangThai(ketQua.duLieu.trangThai);
    });
  }

  const dangCho = dangGui || Boolean(jobId && !anh && !loi);
  return (
    <section className="ban-nhap" aria-live="polite" aria-busy={dangCho}>
      <div className="ban-nhap__luu">
        <div>
          <p className="bien-soan-buoc">04 · Hình ảnh</p>
          <h3>Ảnh minh họa bài đăng</h3>
        </div>
        <button className="btn" type="button" disabled={dangCho || Boolean(anh)} onClick={batDauSinh}>
          {dangCho ? 'Đang tạo ảnh…' : anh ? 'Ảnh đã tạo' : 'Tạo ảnh cho bài'}
        </button>
      </div>

      {trangThai && !anh && !loi ? (
        <p role="status">Trạng thái: {nhanTrangThai(trangThai)}</p>
      ) : null}
      {loi ? <p className="bien-soan-loi" role="alert">{loi}</p> : null}
      {anh ? (
        <img
          className="anh-da-sinh"
          src={urlMedia(anh.duongDan)}
          alt="Ảnh minh họa đã tạo cho bài đăng"
        />
      ) : null}
    </section>
  );
}
