'use client';

import { useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { suaMuc, taoMuc, xoaMuc } from '../actions';
import type { DacTaNhom, Truong } from '@/lib/brand/dac-ta-nhom';

type Dong = Record<string, unknown> & { id: string };

/**
 * Man hinh dung chung cho bon nhom danh sach. Khac nhau duy nhat la `dacTa` —
 * bon ban chep rieng se lech nhau ngay lan dau co ai sua mot cai.
 */
export function DanhSachNhom({ dacTa, danhSach }: { dacTa: DacTaNhom; danhSach: Dong[] }) {
  const [dangSua, datDangSua] = useState<string | null>(null);
  const [dangThem, datDangThem] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);
  const [dangChay, batDau] = useTransition();

  function goiHanhDong(viec: () => Promise<{ ok: boolean; loi?: string }>, xong: () => void) {
    datLoi(null);
    batDau(async () => {
      const kq = await viec();
      if (kq.ok) xong();
      else datLoi(kq.loi ?? 'Không lưu được.');
    });
  }

  return (
    <>
      {loi ? (
        <p className="loi" role="alert">
          {loi}
        </p>
      ) : null}

      {dangThem ? (
        <BieuMau
          dacTa={dacTa}
          dangChay={dangChay}
          onHuy={() => datDangThem(false)}
          onGui={(form) =>
            goiHanhDong(
              () => taoMuc(dacTa.slug, form),
              () => datDangThem(false),
            )
          }
        />
      ) : (
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => {
            datLoi(null);
            datDangThem(true);
          }}
        >
          <Icon name="i-plus" size={17} />
          Thêm {dacTa.tenMot}
        </button>
      )}

      {danhSach.length === 0 && !dangThem ? (
        <p className="trong">
          Chưa có {dacTa.tenMot} nào. Thêm tay ở đây, hoặc dán một trang văn bản có sẵn để hệ
          thống bóc tách giúp.
        </p>
      ) : null}

      <div className="muc-ds">
        {danhSach.map((dong) =>
          dangSua === dong.id ? (
            <div className="muc" key={dong.id}>
              <BieuMau
                dacTa={dacTa}
                dong={dong}
                dangChay={dangChay}
                onHuy={() => datDangSua(null)}
                onGui={(form) =>
                  goiHanhDong(
                    () => suaMuc(dacTa.slug, dong.id, form),
                    () => datDangSua(null),
                  )
                }
              />
            </div>
          ) : (
            <article className="muc" key={dong.id}>
              <div className="muc__dau">
                <p className="muc__ten">{chuoiCua(dong[dacTa.khoaTieuDe]) || '(chưa đặt tên)'}</p>
                <div className="muc__nut">
                  <button
                    className="btn btn--ghost btn--sm"
                    type="button"
                    disabled={dangChay}
                    onClick={() => {
                      datLoi(null);
                      datDangSua(dong.id);
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    type="button"
                    disabled={dangChay}
                    onClick={() => {
                      if (!confirm(`Xoá ${dacTa.tenMot} này?`)) return;
                      goiHanhDong(
                        () => xoaMuc(dacTa.slug, dong.id),
                        () => undefined,
                      );
                    }}
                  >
                    Xoá
                  </button>
                </div>
              </div>

              <dl className="muc__truong">
                {dacTa.truong
                  .filter((t) => t.khoa !== dacTa.khoaTieuDe)
                  .map((truong) => (
                    <div key={truong.khoa}>
                      <dt className="muc__nhan">{truong.nhan}</dt>
                      <dd className="muc__gia-tri">{hienGiaTri(truong, dong[truong.khoa])}</dd>
                    </div>
                  ))}
              </dl>
            </article>
          ),
        )}
      </div>
    </>
  );
}

function BieuMau({
  dacTa,
  dong,
  dangChay,
  onGui,
  onHuy,
}: {
  dacTa: DacTaNhom;
  dong?: Dong;
  dangChay: boolean;
  onGui: (form: FormData) => void;
  onHuy: () => void;
}) {
  return (
    <form
      className="bieu-mau"
      action={onGui}
      // `key` doi theo dong dang sua de React dung lai gia tri mac dinh moi khi
      // chuyen sang sua dong khac.
      key={dong?.id ?? 'them-moi'}
    >
      {dacTa.truong.map((truong) => (
        <ONhap key={truong.khoa} truong={truong} giaTri={dong?.[truong.khoa]} />
      ))}

      <div className="bieu-mau__nut">
        <button className="btn btn--primary" type="submit" disabled={dangChay}>
          {dangChay ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button className="btn btn--ghost" type="button" onClick={onHuy} disabled={dangChay}>
          Huỷ
        </button>
      </div>
    </form>
  );
}

function ONhap({ truong, giaTri }: { truong: Truong; giaTri?: unknown }) {
  const id = `o-${truong.khoa}`;

  if (truong.kieu === 'co') {
    return (
      <div className="o o--co">
        <input type="checkbox" id={id} name={truong.khoa} defaultChecked={giaTri === true} />
        <span>
          <label className="o__nhan" htmlFor={id}>
            {truong.nhan}
          </label>
          {truong.goiY ? <p className="o__goi-y">{truong.goiY}</p> : null}
        </span>
      </div>
    );
  }

  return (
    <div className="o">
      <label className="o__nhan" htmlFor={id}>
        {truong.nhan}
        {truong.batBuoc ? <span className="o__bat-buoc"> *</span> : null}
      </label>
      {truong.goiY ? <p className="o__goi-y">{truong.goiY}</p> : null}
      {truong.kieu === 'doan' ? (
        <textarea id={id} name={truong.khoa} defaultValue={chuoiCua(giaTri)} />
      ) : (
        <input type="text" id={id} name={truong.khoa} defaultValue={chuoiCua(giaTri)} />
      )}
    </div>
  );
}

function chuoiCua(giaTri: unknown): string {
  if (giaTri === null || giaTri === undefined) return '';
  return String(giaTri);
}

function hienGiaTri(truong: Truong, giaTri: unknown) {
  if (truong.kieu === 'co') return giaTri === true ? 'Có' : 'Không';
  const chu = chuoiCua(giaTri);
  return chu === '' ? '—' : chu;
}
