import type { Metadata } from 'next';

import { Icon } from '../../../sprite-icon';
import { ManHinhDeXuat } from './man-hinh-de-xuat';
import '../../brand/brand.css';
import '../studio.css';
import './de-xuat.css';
import './de-xuat-ket-qua.css';

export const metadata: Metadata = {
  title       : 'Đề xuất hôm nay — AI Content',
  description : 'Sinh ý tưởng nội dung từ hồ sơ thương hiệu và dữ liệu kênh.',
};

export default function TrangDeXuat() {
  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-sparkle" size={13} />
            Studio nội dung
          </span>
          <h1 className="page-title">Đề xuất hôm nay</h1>
          <p className="page-sub">
            Kết hợp hồ sơ thương hiệu, insight và lịch sử kênh để tạo một danh sách ý tưởng
            có thể bắt tay viết ngay.
          </p>
        </div>
      </div>

      <ManHinhDeXuat />
    </>
  );
}
