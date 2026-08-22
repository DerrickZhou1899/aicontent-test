'use client';

import { useActionState, useState } from 'react';

import { guiXepLo, type TrangThaiXepLo } from './actions';

type YTuongChon = {
  id     : string;
  tieuDe : string;
  beMat  : string;
};

type ThuocTinh = {
  yTuong : YTuongChon[];
};

const SO_BAI_TOI_DA                   = 10;
const TRANG_THAI_DAU : TrangThaiXepLo = null;

export function ManHinhHangLoat({ yTuong }: ThuocTinh) {
  const [daChon, datDaChon]             = useState<string[]>([]);
  const [ketQua, guiXepLoMoi, dangChay] = useActionState(guiXepLo, TRANG_THAI_DAU);

  function doiLuaChon(id: string, dangChon: boolean) {
    datDaChon((hienTai) => dangChon
      ? [...hienTai, id]
      : hienTai.filter((muc) => muc !== id));
  }

  function tenYTuong(ideaId: string) {
    return yTuong.find((muc) => muc.id === ideaId)?.tieuDe ?? ideaId;
  }

  return (
    <div className="hai-cot">
      <section className="panel" aria-labelledby="chon-y-tuong">
        <p className="eyebrow">01 · Chọn ý tưởng</p>
        <h2 id="chon-y-tuong">Lô bài hôm nay</h2>
        <p className="o__goi-y">Đã chọn {daChon.length}/{SO_BAI_TOI_DA} ý tưởng.</p>

        {yTuong.length === 0 ? (
          <p className="trong">Chưa có ý tưởng mới để sinh bài.</p>
        ) : (
          <form action={guiXepLoMoi}>
            <div className="muc-ds">
              {yTuong.map((muc) => {
                const dangChon = daChon.includes(muc.id);
                return (
                  <label className="muc muc--chon" key={muc.id}>
                    <input
                      type="checkbox"
                      name="ideaIds"
                      value={muc.id}
                      checked={dangChon}
                      disabled={dangChay || (!dangChon && daChon.length >= SO_BAI_TOI_DA)}
                      onChange={(suKien) => doiLuaChon(muc.id, suKien.target.checked)}
                    />
                    <span>
                      <strong className="muc__ten">{muc.tieuDe}</strong>
                      <small className="o__goi-y">{muc.beMat.replaceAll('_', ' ')}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={dangChay || daChon.length === 0}
            >
              {dangChay ? 'Đang xếp lô…' : `Sinh ${daChon.length} bài`}
            </button>
          </form>
        )}
      </section>

      <section className="panel" aria-labelledby="trang-thai-lo" aria-live="polite" aria-busy={dangChay}>
        <p className="eyebrow">02 · Hàng đợi</p>
        <h2 id="trang-thai-lo">Tiến độ sinh bài</h2>
        {!ketQua ? <p className="trong">Các bài vừa xếp sẽ xuất hiện tại đây.</p> : null}
        {ketQua && !ketQua.ok ? <p role="alert">{ketQua.loi}</p> : null}
        {ketQua?.canhBao.map((canhBao) => (
          <p role="alert" key={canhBao}>{canhBao}</p>
        ))}
        {ketQua?.ok ? (
          <>
            <p>Đã xếp {ketQua.duLieu.length} việc vào hàng đợi.</p>
            <div className="muc-ds">
              {ketQua.duLieu.map((muc) => (
                <article className="muc" key={muc.jobId}>
                  <p className="muc__ten">{tenYTuong(muc.ideaId)}</p>
                  <small className="o__goi-y">Trạng thái: {muc.trangThai}</small>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
