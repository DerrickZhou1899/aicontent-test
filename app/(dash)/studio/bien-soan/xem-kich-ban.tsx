'use client';

import { useActionState, useState, useTransition } from 'react';

import type { BanNhapKichBan } from '@/lib/studio/sinh-kich-ban';

import { guiSinhKichBan, luuKichBan, type TrangThaiKichBan } from './actions';

const TRANG_THAI_DAU : TrangThaiKichBan = null;

function KichBanCoTheSua({ ideaId, banDau }: { ideaId: string; banDau: BanNhapKichBan }) {
  const [tieuDe, datTieuDe]       = useState(banDau.tieuDe);
  const [phanCanh, datPhanCanh]   = useState(banDau.phanCanh);
  const [ketQuaLuu, datKetQuaLuu] = useState<Awaited<ReturnType<typeof luuKichBan>> | null>(null);
  const [dangLuu, batDauLuu]      = useTransition();
  const daLuu                     = ketQuaLuu?.ok === true;
  const khongHopLe                = tieuDe.trim() === '' || phanCanh.some(
    (canh) => canh.thoiLuongGiay <= 0 || canh.hinhAnh.trim() === '',
  );

  function suaCanh(viTri: number, giaTri: Partial<BanNhapKichBan['phanCanh'][number]>) {
    datPhanCanh((hienTai) => hienTai.map((canh, chiSo) => (
      chiSo === viTri ? { ...canh, ...giaTri } : canh
    )));
  }

  function guiLuu() {
    datKetQuaLuu(null);
    batDauLuu(async () => {
      datKetQuaLuu(await luuKichBan({ ideaId, kichBan: { tieuDe, phanCanh } }));
    });
  }

  return (
    <div className="ban-nhap">
      <div className="ban-nhap__thong-bao" role="status">
        <strong>{daLuu ? 'Kịch bản đã lưu' : 'Kịch bản đang chỉnh sửa'}</strong>
        <span>{daLuu ? 'Kịch bản đã nằm trong kho nội dung.' : 'Sửa từng cảnh trước khi lưu.'}</span>
      </div>
      <label className="o" htmlFor="kich-ban-tieu-de">
        <span className="o__nhan">Tiêu đề kịch bản</span>
        <input
          id="kich-ban-tieu-de"
          name="tieuDeKichBan"
          disabled={daLuu}
          value={tieuDe}
          onChange={(suKien) => datTieuDe(suKien.target.value)}
        />
      </label>
      {phanCanh.map((canh, viTri) => (
        <fieldset className="kich-ban-canh" disabled={daLuu} key={viTri}>
          <legend>Cảnh {viTri + 1}</legend>
          <label className="o">
            <span className="o__nhan">Thời lượng (giây)</span>
            <input
              name="thoiLuongGiay"
              type="number"
              min="1"
              value={canh.thoiLuongGiay}
              onChange={(suKien) => suaCanh(viTri, { thoiLuongGiay: Number(suKien.target.value) })}
            />
          </label>
          <label className="o">
            <span className="o__nhan">Khung hình</span>
            <textarea
              name="hinhAnh"
              value={canh.hinhAnh}
              onChange={(suKien) => suaCanh(viTri, { hinhAnh: suKien.target.value })}
            />
          </label>
          <label className="o">
            <span className="o__nhan">Lời thoại</span>
            <textarea
              name="loiThoai"
              value={canh.loiThoai}
              onChange={(suKien) => suaCanh(viTri, { loiThoai: suKien.target.value })}
            />
          </label>
        </fieldset>
      ))}
      <div className="ban-nhap__luu">
        <button
          className="btn btn--primary"
          type="button"
          disabled={dangLuu || daLuu || khongHopLe}
          onClick={guiLuu}
        >
          {dangLuu ? 'Đang lưu…' : daLuu ? 'Đã lưu' : 'Lưu kịch bản'}
        </button>
        {daLuu ? <span className="ban-nhap__thanh-cong">Đã lưu vào kho nội dung.</span> : null}
        {ketQuaLuu && !ketQuaLuu.ok ? (
          <span className="bien-soan-loi" role="alert">{ketQuaLuu.loi}</span>
        ) : null}
      </div>
    </div>
  );
}

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
          {dangChay ? 'Đang chia phân cảnh…' : 'Tạo kịch bản quay'}
        </button>
      </form>
      {ketQua && !ketQua.ok ? <p className="bien-soan-loi" role="alert">{ketQua.loi}</p> : null}
      {ketQua?.ok ? (
        <KichBanCoTheSua
          key={`${ketQua.duLieu.ideaId}-${ketQua.duLieu.kichBan.tieuDe}`}
          ideaId={ketQua.duLieu.ideaId}
          banDau={ketQua.duLieu.kichBan}
        />
      ) : null}
    </section>
  );
}
