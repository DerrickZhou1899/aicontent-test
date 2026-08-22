'use client';

import { useActionState } from 'react';

import { guiDeXuat, type TrangThaiDeXuat } from './actions';

const TRANG_THAI_DAU: TrangThaiDeXuat = null;

const BE_MAT = [
  { giaTri: 'fanpage', nhan: 'Fanpage' },
  { giaTri: 'ho_so_ca_nhan', nhan: 'Hồ sơ cá nhân' },
  { giaTri: 'tiktok', nhan: 'TikTok' },
  { giaTri: 'zalo', nhan: 'Zalo' },
];

export function ManHinhDeXuat() {
  const [ketQua, gui, dangChay] = useActionState(guiDeXuat, TRANG_THAI_DAU);

  return (
    <div className="de-xuat-layout">
      <section className="panel de-xuat-dieu-khien" aria-labelledby="de-xuat-cau-hinh">
        <div>
          <p className="de-xuat-buoc">01 · Cấu hình</p>
          <h2 id="de-xuat-cau-hinh">Một lần sinh, một danh sách để duyệt</h2>
          <p className="o__goi-y">
            Mỗi lượt tối đa 20 ý tưởng. Khoảng 20% được dành cho tuyến khám phá để kênh
            không chỉ lặp lại những gì từng hiệu quả.
          </p>
        </div>

        <form className="de-xuat-form" action={gui}>
          <fieldset className="de-xuat-fieldset">
            <legend>Bề mặt đăng</legend>
            <div className="chon-be-mat">
              {BE_MAT.map((muc, chiSo) => (
                <label className="de-xuat-lua-chon" key={muc.giaTri}>
                  <input
                    type="radio"
                    name="beMat"
                    value={muc.giaTri}
                    defaultChecked={chiSo === 0}
                  />
                  <span>{muc.nhan}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="o de-xuat-so-luong" htmlFor="de-xuat-so-luong">
            <span className="o__nhan">Số ý tưởng</span>
            <input
              id="de-xuat-so-luong"
              name="soLuong"
              type="number"
              min="1"
              max="20"
              defaultValue="10"
              required
            />
          </label>

          <button className="btn btn--primary de-xuat-gui" type="submit" disabled={dangChay}>
            {dangChay ? 'Đang tìm góc viết…' : 'Tạo danh sách ý tưởng'}
          </button>
        </form>
      </section>

      <section className="de-xuat-ket-qua" aria-live="polite" aria-busy={dangChay}>
        <div className="de-xuat-ket-qua__dau">
          <div>
            <p className="de-xuat-buoc">02 · Kết quả</p>
            <h2>Ý tưởng để duyệt</h2>
          </div>
          {ketQua?.ok ? <span className="de-xuat-dem">{ketQua.duLieu.length} ý tưởng</span> : null}
        </div>

        {ketQua === null ? (
          <div className="de-xuat-trong">
            <span aria-hidden="true">10</span>
            <p>Chọn bề mặt rồi tạo danh sách đầu tiên cho hôm nay.</p>
          </div>
        ) : null}

        {ketQua && !ketQua.ok ? <p className="de-xuat-loi" role="alert">{ketQua.loi}</p> : null}

        {ketQua?.canhBao.map((canhBao) => (
          <p className="de-xuat-canh-bao" key={canhBao}>{canhBao}</p>
        ))}

        {ketQua?.ok ? (
          <div className="de-xuat-danh-sach">
            {ketQua.duLieu.map((yTuong, chiSo) => (
              <article className="de-xuat-the" key={`${chiSo}-${yTuong.tieuDe}`}>
                <div className="de-xuat-the__dau">
                  <span className="de-xuat-thu-tu">{String(chiSo + 1).padStart(2, '0')}</span>
                  {yTuong.khamPha ? <span className="de-xuat-kham-pha">Khám phá</span> : null}
                </div>
                <h3>{yTuong.tieuDe}</h3>
                <div className="de-xuat-the__the">
                  <span>{yTuong.truCot ?? 'Chưa gắn trụ cột'}</span>
                  <span>{yTuong.chanDung ?? 'Chưa gắn chân dung'}</span>
                </div>
                {yTuong.cauMoDau ? <blockquote>{yTuong.cauMoDau}</blockquote> : null}
                {yTuong.lyDoDeXuat ? <p>{yTuong.lyDoDeXuat}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
