import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { ManHinhDan } from './man-hinh-dan';
import '../brand.css';

export const metadata: Metadata = {
  title: 'Bóc tách hồ sơ từ văn bản — AI Content',
};

export default function TrangDanVanBan() {
  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-sparkle" size={13} />
            <Link href="/brand">Hồ sơ kênh</Link>
          </span>
          <h1 className="page-title">Bóc tách hồ sơ từ văn bản</h1>
          <p className="page-sub">
            Dán bất kỳ văn bản nào đang có — giới thiệu công ty, mô tả sản phẩm, ghi chú bán
            hàng. Hệ thống bóc thành hồ sơ có cấu trúc để bạn kiểm và sửa, rồi mới lưu.
          </p>
        </div>
      </div>

      <section className="panel" aria-label="Bóc tách hồ sơ">
        <ManHinhDan />
      </section>
    </>
  );
}
