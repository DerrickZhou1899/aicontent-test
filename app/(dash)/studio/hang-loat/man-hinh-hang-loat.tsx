'use client';

import { useActionState, useEffect, useEffectEvent, useRef, useState } from 'react';

import type { ViecTheoDoi } from '@/lib/studio/trang-thai-hang-loat';

import { guiDocTrangThaiLo, guiXepLo, type TrangThaiXepLo } from './actions';

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
const TRANG_THAI_KET_THUC              = ['xong', 'loi', 'huy'];

export function ManHinhHangLoat({ yTuong }: ThuocTinh) {
  const maLoHienTai                         = useRef(0);
  const [daChon, datDaChon]                 = useState<string[]>([]);
  const [trangThaiLo, datTrangThaiLo]       = useState<Awaited<ReturnType<typeof guiDocTrangThaiLo>> | null>(null);
  const [ketQua, guiXepLoMoi, dangChay]     = useActionState(guiXepLo, TRANG_THAI_DAU);

  const docTrangThai = useEffectEvent(async (viec: ViecTheoDoi[]) => {
    try {
      return await guiDocTrangThaiLo(viec);
    } catch {
      return { ok: false as const, loi: 'Không thể đọc tiến độ. Hãy thử lại.', canhBao: [] };
    }
  });

  useEffect(() => {
    if (!ketQua?.ok || dangChay) return;
    const viec = ketQua.duLieu.map(({ ideaId, jobId }) => ({ ideaId, jobId }));
    maLoHienTai.current += 1;
    const maLo     = maLoHienTai.current;
    let conTheoDoi = true;
    let henGio     : ReturnType<typeof setTimeout>;

    async function capNhat() {
      const moi = await docTrangThai(viec);
      if (!conTheoDoi || maLo !== maLoHienTai.current) return;
      datTrangThaiLo(moi);
      if (moi.ok && moi.duLieu.some((muc) => !TRANG_THAI_KET_THUC.includes(muc.trangThai))) {
        henGio = setTimeout(capNhat, 2_000);
      }
    }

    void capNhat();
    return () => {
      conTheoDoi = false;
      clearTimeout(henGio);
    };
  }, [ketQua, dangChay]);

  function doiLuaChon(id: string, dangChon: boolean) {
    datDaChon((hienTai) => dangChon
      ? [...hienTai, id]
      : hienTai.filter((muc) => muc !== id));
  }

  function tenYTuong(ideaId: string) {
    return yTuong.find((muc) => muc.id === ideaId)?.tieuDe ?? ideaId;
  }

  function batDauLoMoi() {
    maLoHienTai.current += 1;
    datTrangThaiLo(null);
  }

  const danhSach = trangThaiLo?.ok
    ? trangThaiLo.duLieu
    : ketQua?.ok
      ? ketQua.duLieu.map((muc) => ({ ...muc, banNhap: null, loi: null }))
      : [];
  const daKetThuc = danhSach.filter((muc) => TRANG_THAI_KET_THUC.includes(muc.trangThai)).length;
  const phanTram  = danhSach.length === 0 ? 0 : Math.round((daKetThuc / danhSach.length) * 100);

  return (
    <div className="hai-cot">
      <section className="panel" aria-labelledby="chon-y-tuong">
        <p className="eyebrow">01 · Chọn ý tưởng</p>
        <h2 id="chon-y-tuong">Lô bài hôm nay</h2>
        <p className="o__goi-y">Đã chọn {daChon.length}/{SO_BAI_TOI_DA} ý tưởng.</p>

        {yTuong.length === 0 ? (
          <p className="trong">Chưa có ý tưởng mới để sinh bài.</p>
        ) : (
          <form action={guiXepLoMoi} onSubmit={batDauLoMoi}>
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

      <section className="panel" aria-labelledby="trang-thai-lo" aria-live="polite" aria-busy={dangChay || daKetThuc < danhSach.length}>
        <p className="eyebrow">02 · Hàng đợi</p>
        <h2 id="trang-thai-lo">Tiến độ sinh bài</h2>
        {!ketQua ? <p className="trong">Các bài vừa xếp sẽ xuất hiện tại đây.</p> : null}
        {ketQua && !ketQua.ok ? <p role="alert">{ketQua.loi}</p> : null}
        {ketQua?.canhBao.map((canhBao) => (
          <p role="alert" key={canhBao}>{canhBao}</p>
        ))}
        {trangThaiLo && !trangThaiLo.ok ? <p role="alert">{trangThaiLo.loi}</p> : null}
        {ketQua?.ok ? (
          <>
            <div className="tien-do">
              <span>{daKetThuc}/{danhSach.length} bài đã kết thúc</span>
              <span className="tien-do__thanh">
                <span className="tien-do__chay" style={{ width: `${phanTram}%` }} />
              </span>
            </div>
            <div className="muc-ds">
              {danhSach.map((muc) => (
                <article className="muc" key={muc.jobId}>
                  <p className="muc__ten">{tenYTuong(muc.ideaId)}</p>
                  {muc.banNhap ? (
                    <>
                      <h3>{muc.banNhap.tieuDe}</h3>
                      <p className="cot-be-mat__than">{muc.banNhap.noiDung}</p>
                      <small className="o__goi-y">{muc.banNhap.hashtag.join(' ')}</small>
                    </>
                  ) : (
                    <small className="o__goi-y">{muc.loi ?? `Trạng thái: ${muc.trangThai}`}</small>
                  )}
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
