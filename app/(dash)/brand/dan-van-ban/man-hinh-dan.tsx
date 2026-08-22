'use client';

import { useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { luuBanNhap, xemTruocBocTach } from '../actions';
import type { BanNhapHoSo } from '@/lib/brand/boc-tach';

type Buoc = 'dan' | 'xem-truoc' | 'da-luu';

/**
 * Ba buoc: dan -> XEM TRUOC VA SUA -> luu.
 *
 * Buoc giua la bat buoc theo PRD muc 8.3. Mo hinh boc sai ma ghi thang vao ho so
 * thi cai sai do lan ra moi de xuat, moi bai viet sau nay, va nguoi dung khong
 * co cach nao biet no bat dau tu dau. Bo qua buoc nay de "nhanh hon" la doi mot
 * phut lay mot thang lech huong.
 */
export function ManHinhDan() {
  const [buoc, datBuoc] = useState<Buoc>('dan');
  const [vanBan, datVanBan] = useState('');
  const [banNhap, datBanNhap] = useState<BanNhapHoSo | null>(null);
  const [moHinh, datMoHinh] = useState<string | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [dangChay, batDau] = useTransition();

  function chay() {
    datLoi(null);
    batDau(async () => {
      const kq = await xemTruocBocTach(vanBan);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datBanNhap(kq.banNhap);
      datMoHinh(kq.moHinh);
      datBuoc('xem-truoc');
    });
  }

  function luu() {
    if (!banNhap) return;
    datLoi(null);
    batDau(async () => {
      const kq = await luuBanNhap(banNhap);
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datBuoc('da-luu');
    });
  }

  if (buoc === 'da-luu') {
    return (
      <div className="chan chan--mo" role="status">
        <p className="chan__tieu-de">
          <Icon name="i-check" size={17} />
          Đã lưu vào hồ sơ
        </p>
        <p className="chan__sub">
          Các mục vừa bóc được <strong>thêm mới</strong>, không ghi đè thứ đã có. Mở lại từng
          nhóm để kiểm và sửa tiếp.
        </p>
        <div className="bieu-mau__nut">
          <a className="btn btn--primary btn--sm" href="/brand">
            Về tổng quan hồ sơ
          </a>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => {
              datVanBan('');
              datBanNhap(null);
              datBuoc('dan');
            }}
          >
            Dán văn bản khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dan">
      {loi ? (
        <p className="loi" role="alert">
          {loi}
        </p>
      ) : null}

      {buoc === 'dan' ? (
        <>
          <textarea
            aria-label="Văn bản thô"
            placeholder="Dán vào đây: giới thiệu công ty, mô tả sản phẩm, ghi chú bán hàng, tin nhắn tư vấn khách…"
            value={vanBan}
            onChange={(e) => datVanBan(e.target.value)}
          />
          <div className="bieu-mau__nut">
            <button
              className="btn btn--primary"
              type="button"
              onClick={chay}
              disabled={dangChay || vanBan.trim() === ''}
            >
              <Icon name="i-sparkle" size={17} />
              {dangChay ? 'Đang bóc tách…' : 'Bóc tách'}
            </button>
            <span className="ghi-chu-mo-hinh">{vanBan.length} ký tự</span>
          </div>
        </>
      ) : null}

      {buoc === 'xem-truoc' && banNhap ? (
        <XemTruoc
          banNhap={banNhap}
          moHinh={moHinh}
          dangChay={dangChay}
          onDoi={datBanNhap}
          onLuu={luu}
          onQuayLai={() => datBuoc('dan')}
        />
      ) : null}
    </div>
  );
}

function XemTruoc({
  banNhap,
  moHinh,
  dangChay,
  onDoi,
  onLuu,
  onQuayLai,
}: {
  banNhap: BanNhapHoSo;
  moHinh: string | null;
  dangChay: boolean;
  onDoi: (bn: BanNhapHoSo) => void;
  onLuu: () => void;
  onQuayLai: () => void;
}) {
  const tong =
    banNhap.sanPham.length + banNhap.chanDung.length + banNhap.truCot.length;

  /** Sua mot o cua mot dong trong ban nhap — luu ra dung ban da sua. */
  function suaDong<K extends 'sanPham' | 'chanDung' | 'truCot'>(
    nhom: K,
    chiSo: number,
    khoa: string,
    giaTri: string,
  ) {
    const ds = [...banNhap[nhom]];
    ds[chiSo] = { ...ds[chiSo], [khoa]: giaTri === '' ? null : giaTri };
    onDoi({ ...banNhap, [nhom]: ds });
  }

  function boDong(nhom: 'sanPham' | 'chanDung' | 'truCot', chiSo: number) {
    onDoi({ ...banNhap, [nhom]: banNhap[nhom].filter((_, i) => i !== chiSo) });
  }

  return (
    <div className="xem-truoc">
      <div className="chan chan--chan">
        <p className="chan__tieu-de">
          <Icon name="i-eye" size={17} />
          Kiểm trước khi lưu
        </p>
        <p className="chan__sub">
          Đây mới là bản nháp, <strong>chưa có gì được ghi vào hồ sơ</strong>. Sửa thẳng trong
          các ô dưới đây rồi mới bấm lưu — hệ thống lưu đúng bản bạn sửa, không phải bản gốc
          của mô hình. Bóc được {tong} mục.
          {moHinh ? ` Mô hình: ${moHinh}.` : ''}
        </p>
      </div>

      <section className="xem-truoc__khoi">
        <h2 className="xem-truoc__tieu-de">Hồ sơ chung</h2>
        {(['moTa', 'giongDieu', 'dieuCamKy'] as const).map((khoa) => (
          <div className="o" key={khoa}>
            <label className="o__nhan" htmlFor={`hs-${khoa}`}>
              {khoa === 'moTa' ? 'Mô tả' : khoa === 'giongDieu' ? 'Giọng điệu' : 'Điều cấm kỵ'}
            </label>
            <textarea
              id={`hs-${khoa}`}
              value={banNhap.hoSo[khoa] ?? ''}
              onChange={(e) =>
                onDoi({
                  ...banNhap,
                  hoSo: { ...banNhap.hoSo, [khoa]: e.target.value === '' ? null : e.target.value },
                })
              }
            />
          </div>
        ))}
        <p className="o__goi-y">
          Ô để trống thì giữ nguyên giá trị đang có trong hồ sơ, không xoá mất.
        </p>
      </section>

      <KhoiNhom
        ten="Sản phẩm"
        nhom="sanPham"
        dong={banNhap.sanPham}
        truong={[
          ['ten', 'Tên'],
          ['gia', 'Giá'],
          ['loiIch', 'Lợi ích'],
          ['phanDoiThuongGap', 'Phản đối thường gặp'],
          ['loiKeuGoi', 'Lời kêu gọi'],
        ]}
        onSua={suaDong}
        onBo={boDong}
      />
      <KhoiNhom
        ten="Chân dung khách hàng"
        nhom="chanDung"
        dong={banNhap.chanDung}
        truong={[
          ['ten', 'Tên nhóm'],
          ['doTuoi', 'Độ tuổi'],
          ['ngheNghiep', 'Nghề nghiệp'],
          ['noiDau', 'Nỗi đau'],
          ['mongMuon', 'Mong muốn'],
          ['cauNoiThuongDung', 'Câu hay nói'],
        ]}
        onSua={suaDong}
        onBo={boDong}
      />
      <KhoiNhom
        ten="Trụ cột nội dung"
        nhom="truCot"
        dong={banNhap.truCot}
        truong={[
          ['ten', 'Tên'],
          ['mucDich', 'Mục đích'],
        ]}
        onSua={suaDong}
        onBo={boDong}
      />

      <div className="bieu-mau__nut">
        <button className="btn btn--primary" type="button" onClick={onLuu} disabled={dangChay}>
          {dangChay ? 'Đang lưu…' : 'Lưu bản đã sửa vào hồ sơ'}
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={onQuayLai}
          disabled={dangChay}
        >
          Quay lại, không lưu
        </button>
      </div>
    </div>
  );
}

function KhoiNhom({
  ten,
  nhom,
  dong,
  truong,
  onSua,
  onBo,
}: {
  ten: string;
  nhom: 'sanPham' | 'chanDung' | 'truCot';
  dong: Record<string, string | null>[];
  truong: [string, string][];
  onSua: (
    nhom: 'sanPham' | 'chanDung' | 'truCot',
    chiSo: number,
    khoa: string,
    giaTri: string,
  ) => void;
  onBo: (nhom: 'sanPham' | 'chanDung' | 'truCot', chiSo: number) => void;
}) {
  return (
    <section className="xem-truoc__khoi">
      <h2 className="xem-truoc__tieu-de">
        {ten}
        <span className="xem-truoc__dem">{dong.length} mục</span>
      </h2>

      {dong.length === 0 ? (
        <p className="trong">Văn bản không nói tới nhóm này.</p>
      ) : (
        dong.map((mon, chiSo) => (
          <div className="xem-truoc__mon" key={chiSo}>
            {truong.map(([khoa, nhan]) => (
              <div className="o" key={khoa}>
                <label className="o__nhan" htmlFor={`${nhom}-${chiSo}-${khoa}`}>
                  {nhan}
                </label>
                <input
                  type="text"
                  id={`${nhom}-${chiSo}-${khoa}`}
                  value={mon[khoa] ?? ''}
                  onChange={(e) => onSua(nhom, chiSo, khoa, e.target.value)}
                />
              </div>
            ))}
            <div className="xem-truoc__bo">
              <button
                className="btn btn--ghost btn--sm"
                type="button"
                onClick={() => onBo(nhom, chiSo)}
              >
                Bỏ mục này
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
