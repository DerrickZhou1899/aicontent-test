import type { Metadata } from 'next';

import { Icon } from '../../../sprite-icon';
import { danhSachKenhTheoDoi } from './actions';
import { KhoiKenhTheoDoi } from './khoi-kenh-theo-doi';
import { ManHinhCaiDatKenh } from './man-hinh-cai-dat-kenh';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import '../../brand/brand.css';
import '../../studio/studio.css';
// Bang kenh theo doi dung lai lop bang cua man "Bai da dang".
import '../../bai-da-dang/bai-da-dang.css';

export const metadata: Metadata = {
  title: 'Cài đặt kênh — AI Content',
};

export default async function TrangCaiDatKenh() {
  const repo = createRepo(await workspaceHienTai());
  const kenh = await repo.kenh.theoBeMat('ho_so_ca_nhan');
  const kenhTheoDoi = await danhSachKenhTheoDoi();

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-link" size={13} />
            Cài đặt
          </span>
          <h1 className="page-title">Kênh của bạn</h1>
          <p className="page-sub">
            Dán liên kết trang cá nhân Facebook rồi kéo bài đã đăng về. Bài kéo về là cơ sở
            thật để máy viết đúng giọng bạn, thay vì đoán.
          </p>
        </div>
      </div>

      <section className="panel" aria-label="Cài đặt kênh">
        <ManHinhCaiDatKenh urlKenh={kenh?.urlKenh ?? null} />
      </section>

      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-trend" size={13} />
            Theo dõi
          </span>
          <h1 className="page-title">Kênh ngoài kia</h1>
          <p className="page-sub">
            Theo dõi kênh của người khác để biết ngoài kia đang làm nội dung gì. Máy học{' '}
            <strong>chủ đề và cách kể</strong> từ bài của họ rồi đề xuất ý tưởng cho bạn —
            không viết lại bài của họ, giọng vẫn của kênh bạn.
          </p>
        </div>
      </div>

      <section className="panel" aria-label="Kênh theo dõi">
        <KhoiKenhTheoDoi kenh={kenhTheoDoi} />
      </section>
    </>
  );
}
