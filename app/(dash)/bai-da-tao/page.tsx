import type { Metadata } from 'next';
import Link from 'next/link';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';

import { Icon } from '../../sprite-icon';
import '../brand/brand.css';
import './bai-da-tao.css';

export const metadata: Metadata = {
  title : 'Bản nháp đã lưu — AI Content',
};

export default async function TrangBaiDaTao() {
  const repo = createRepo(await workspaceHienTai());
  const bai  = await repo.contents.list({ trangThai: 'ban_nhap', gioiHan: 200 });
  const assets = await repo.asset.theoNoiDung(bai.map((muc) => muc.id));
  const baiCoAnh = new Set(
    assets.filter((muc) => muc.loai === 'anh' && muc.duongDan).map((muc) => muc.contentId),
  );

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-folder" size={13} />
            Kho nội dung
          </span>
          <h1 className="page-title">Bản nháp đã lưu</h1>
          <p className="page-sub">
            Các bài đã tạo và lưu từ màn hình biên soạn hoặc tạo hàng loạt.
          </p>
        </div>
      </div>

      {bai.length === 0 ? (
        <section className="panel trong">
          Chưa có bản nháp. Hãy tạo bài từ một ý tưởng đã duyệt.
        </section>
      ) : (
        <section className="kho-ban-nhap" aria-label="Bản nháp đã lưu">
          {bai.map((muc, viTri) => (
            <Link className="the-ban-nhap" href={`/bai-da-tao/${muc.id}`} key={muc.id}>
              <article>
                <div className="the-ban-nhap__dau">
                  <span>Bản nháp {String(viTri + 1).padStart(2, '0')}</span>
                  <span>{muc.beMat.replaceAll('_', ' ')}</span>
                </div>
                <p className="the-ban-nhap__noi-dung">{muc.noiDung}</p>
                <div className="the-ban-nhap__chan">
                  <span className={baiCoAnh.has(muc.id) ? 'nhan-anh nhan-anh--co' : 'nhan-anh'}>
                    {baiCoAnh.has(muc.id) ? 'Đã có ảnh' : 'Chưa có ảnh'}
                  </span>
                  <strong>Chỉnh sửa và tạo ảnh →</strong>
                </div>
                <small>Lưu lúc {muc.ngayTao.toLocaleString('vi-VN')}</small>
              </article>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
