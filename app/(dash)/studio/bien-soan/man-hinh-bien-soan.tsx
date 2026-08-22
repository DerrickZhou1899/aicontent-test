'use client';

import { useActionState, useState, useTransition } from 'react';

import type { BanNhapBai } from '@/lib/studio/sinh-bai';

import { guiSinhBai, luuBanNhap, type TrangThaiBienSoan } from './actions';
import { XemKichBan } from './xem-kich-ban';

type YTuongChon = {
  id     : string;
  tieuDe : string;
  beMat  : string;
};

const TRANG_THAI_DAU: TrangThaiBienSoan = null;

function demTu(noiDung: string): number {
  const sach = noiDung.trim();
  return sach === '' ? 0 : sach.split(/\s+/).length;
}

function BanNhapCoTheSua({ ideaId, banDau }: { ideaId: string; banDau: BanNhapBai }) {
  const [tieuDe, datTieuDe]         = useState(banDau.tieuDe);
  const [noiDung, datNoiDung]       = useState(banDau.noiDung);
  const [hashtag, datHashtag]       = useState(banDau.hashtag.join(' '));
  const [ketQuaLuu, datKetQuaLuu]   = useState<Awaited<ReturnType<typeof luuBanNhap>> | null>(null);
  const [dangLuu, batDauLuu]        = useTransition();
  const daLuu                       = ketQuaLuu?.ok === true;

  function guiLuu() {
    datKetQuaLuu(null);
    batDauLuu(async () => {
      datKetQuaLuu(await luuBanNhap({ ideaId, tieuDe, noiDung, hashtag }));
    });
  }

  return (
    <div className="ban-nhap">
      <div className="ban-nhap__thong-bao" role="status">
        <strong>{ketQuaLuu?.ok ? 'Bản nháp đã lưu' : 'Bản nháp đang chỉnh sửa'}</strong>
        <span>
          {daLuu
            ? 'Nội dung đã nằm trong kho và ý tưởng được đánh dấu đã dùng.'
            : 'Nội dung này chưa được lưu vào kho. Thay đổi trong ô sẽ là bản đem đi lưu.'}
        </span>
      </div>

      <label className="o" htmlFor="ban-nhap-tieu-de">
        <span className="o__nhan">Tiêu đề làm việc</span>
        <input
          id="ban-nhap-tieu-de"
          name="tieuDe"
          disabled={daLuu}
          value={tieuDe}
          onChange={(suKien) => datTieuDe(suKien.target.value)}
        />
      </label>

      <label className="o soan" htmlFor="ban-nhap-noi-dung">
        <span className="o__nhan">Nội dung bài đăng</span>
        <textarea
          className="soan__o"
          id="ban-nhap-noi-dung"
          name="noiDung"
          disabled={daLuu}
          value={noiDung}
          onChange={(suKien) => datNoiDung(suKien.target.value)}
        />
        <span className="soan__do">{demTu(noiDung)} từ · {noiDung.length} ký tự</span>
      </label>

      <label className="o" htmlFor="ban-nhap-hashtag">
        <span className="o__nhan">Hashtag</span>
        <input
          id="ban-nhap-hashtag"
          name="hashtag"
          disabled={daLuu}
          value={hashtag}
          onChange={(suKien) => datHashtag(suKien.target.value)}
        />
      </label>

      <div className="ban-nhap__luu">
        <button
          className="btn btn--primary"
          type="button"
          disabled={dangLuu || tieuDe.trim() === '' || noiDung.trim() === '' || ketQuaLuu?.ok}
          onClick={guiLuu}
        >
          {dangLuu ? 'Đang lưu…' : daLuu ? 'Đã lưu' : 'Lưu bản nháp'}
        </button>
        {ketQuaLuu?.ok ? (
          <span className="ban-nhap__thanh-cong" role="status">Đã lưu vào kho nội dung.</span>
        ) : null}
        {ketQuaLuu && !ketQuaLuu.ok ? (
          <span className="bien-soan-loi" role="alert">{ketQuaLuu.loi}</span>
        ) : null}
      </div>

      <XemKichBan ideaId={ideaId} />
    </div>
  );
}

export function ManHinhBienSoan({ yTuong }: { yTuong: YTuongChon[] }) {
  const [ketQua, gui, dangChay] = useActionState(guiSinhBai, TRANG_THAI_DAU);

  return (
    <div className="bien-soan-layout">
      <section className="panel bien-soan-chon" aria-labelledby="chon-y-tuong">
        <p className="bien-soan-buoc">01 · Chọn ý tưởng</p>
        <h2 id="chon-y-tuong">Bắt đầu từ điều đã duyệt</h2>
        <p className="o__goi-y">
          AI sẽ dùng hồ sơ thương hiệu, trụ cột và chân dung gắn với ý tưởng này.
        </p>

        {yTuong.length === 0 ? (
          <p className="bien-soan-trong">Chưa có ý tưởng. Hãy tạo ý tưởng trước khi biên soạn.</p>
        ) : (
          <form className="bien-soan-form" action={gui}>
            <label className="o" htmlFor="bien-soan-y-tuong">
              <span className="o__nhan">Ý tưởng</span>
              <select id="bien-soan-y-tuong" name="ideaId" required>
                {yTuong.map((muc) => (
                  <option value={muc.id} key={muc.id}>
                    {muc.tieuDe} · {muc.beMat.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn--primary" type="submit" disabled={dangChay}>
              {dangChay ? 'Đang viết bản đầu…' : 'Sinh bản nháp'}
            </button>
          </form>
        )}
      </section>

      <section className="panel bien-soan-ket-qua" aria-live="polite" aria-busy={dangChay}>
        <div>
          <p className="bien-soan-buoc">02 · Biên tập</p>
          <h2>Sửa trước khi lưu</h2>
        </div>
        {ketQua === null ? (
          <p className="bien-soan-trong">Bản nháp sẽ xuất hiện ở đây để bạn chỉnh trực tiếp.</p>
        ) : null}
        {ketQua && !ketQua.ok ? <p className="bien-soan-loi" role="alert">{ketQua.loi}</p> : null}
        {ketQua?.ok ? (
          <BanNhapCoTheSua
            key={`${ketQua.duLieu.ideaId}-${ketQua.duLieu.banNhap.noiDung}`}
            ideaId={ketQua.duLieu.ideaId}
            banDau={ketQua.duLieu.banNhap}
          />
        ) : null}
      </section>
    </div>
  );
}
