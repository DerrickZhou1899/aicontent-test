'use client';

import { useActionState } from 'react';

import { guiSinhKichBan, type TrangThaiKichBan } from './actions';

const TRANG_THAI_DAU : TrangThaiKichBan = null;

export function XemKichBan({ ideaId }: { ideaId: string }) {
  const [ketQua, gui, dangChay] = useActionState(guiSinhKichBan, TRANG_THAI_DAU);

  return (
    <section className="ban-nhap" aria-live="polite" aria-busy={dangChay}>
      <div>
        <p className="bien-soan-buoc">03 · Kịch bản quay</p>
        <h3>Chia nội dung thành từng cảnh</h3>
        <p className="o__goi-y">
          Chọn thời lượng để AI cân đối khung hình và lời thoại thành một mạch quay liền.
        </p>
      </div>

      <form className="bien-soan-form" action={gui}>
        <input type="hidden" name="ideaId" value={ideaId} />
        <label className="o" htmlFor="kich-ban-thoi-luong">
          <span className="o__nhan">Thời lượng mục tiêu</span>
          <select id="kich-ban-thoi-luong" name="thoiLuongMucTieuGiay" defaultValue="45">
            <option value="30">30 giây · ngắn gọn</option>
            <option value="45">45 giây · cân bằng</option>
            <option value="60">60 giây · đầy đủ</option>
          </select>
        </label>
        <button className="btn btn--primary" type="submit" disabled={dangChay}>
          {dangChay ? 'Đang chia phân cảnh…' : 'Sinh kịch bản quay'}
        </button>
      </form>

      {ketQua && !ketQua.ok ? <p className="bien-soan-loi" role="alert">{ketQua.loi}</p> : null}
      {ketQua?.ok ? (
        <div className="ban-nhap">
          <div className="ban-nhap__thong-bao" role="status">
            <strong>{ketQua.duLieu.kichBan.tieuDe}</strong>
            <span>{ketQua.duLieu.kichBan.phanCanh.length} phân cảnh đã sẵn sàng để quay.</span>
          </div>
          {ketQua.duLieu.kichBan.phanCanh.map((canh, viTri) => (
            <article className="ban-nhap__thong-bao" key={`${viTri}-${canh.hinhAnh}`}>
              <strong>Cảnh {viTri + 1} · {canh.thoiLuongGiay} giây</strong>
              <span><b>Khung hình:</b> {canh.hinhAnh}</span>
              <span><b>Lời thoại:</b> {canh.loiThoai || 'Không có lời thoại.'}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
