import Link from 'next/link';

import type { YTuongChiTiet } from '@/lib/data-access/ideas';

type ThuocTinh = {
  danhSach : YTuongChiTiet[];
};

const DINH_DANG_NGAY = new Intl.DateTimeFormat('vi-VN', {
  day   : '2-digit',
  month : '2-digit',
  year  : 'numeric',
});

function lienKetAnToan(giaTri: string | null): string | null {
  if (!giaTri) return null;

  try {
    const lienKet = new URL(giaTri);
    return /^https?:$/.test(lienKet.protocol) ? lienKet.href : null;
  } catch {
    return null;
  }
}

function NguonThamKhao({ yTuong }: { yTuong: YTuongChiTiet }) {
  const lienKet = lienKetAnToan(yTuong.lienKetNguon);
  if (!yTuong.tieuDeNguon && !lienKet) return null;

  return (
    <div className="y-tuong-da-luu__nguon">
      <span>Nguồn tham khảo</span>
      {lienKet ? (
        <a href={lienKet} target="_blank" rel="noreferrer">
          {yTuong.tieuDeNguon ?? 'Mở bài tham khảo'}
        </a>
      ) : (
        <p>{yTuong.tieuDeNguon}</p>
      )}
    </div>
  );
}

export function DanhSachYTuong({ danhSach }: ThuocTinh) {
  return (
    <section className="panel y-tuong-da-luu" aria-labelledby="y-tuong-da-luu">
      <div className="y-tuong-da-luu__dau">
        <div>
          <p className="de-xuat-buoc">03 · Kho ý tưởng</p>
          <h2 id="y-tuong-da-luu">Ý tưởng đã lưu</h2>
        </div>
        <span>{danhSach.length} ý tưởng</span>
      </div>

      {danhSach.length === 0 ? (
        <p className="y-tuong-da-luu__trong">Ý tưởng vừa tạo sẽ xuất hiện tại đây.</p>
      ) : (
        <div className="y-tuong-da-luu__danh-sach">
          {danhSach.map((yTuong) => (
            <article className="y-tuong-da-luu__the" key={yTuong.id}>
              <Link
                className="y-tuong-da-luu__mo"
                href={`/studio/bien-soan?ideaId=${encodeURIComponent(yTuong.id)}`}
              >
                <div className="y-tuong-da-luu__meta">
                  <span>{yTuong.beMat.replaceAll('_', ' ')}</span>
                  <time dateTime={yTuong.ngayTao.toISOString()}>
                    {DINH_DANG_NGAY.format(yTuong.ngayTao)}
                  </time>
                </div>
                <h3>{yTuong.tieuDe}</h3>
                <div className="y-tuong-da-luu__nhan">
                  <span>{yTuong.tenTruCot ?? 'Chưa gắn trụ cột'}</span>
                  <span>{yTuong.tenChanDung ?? 'Chưa gắn chân dung'}</span>
                </div>
                {yTuong.lyDoDeXuat ? <p>{yTuong.lyDoDeXuat}</p> : null}
                <strong>Biên soạn ý tưởng</strong>
              </Link>
              <NguonThamKhao yTuong={yTuong} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
