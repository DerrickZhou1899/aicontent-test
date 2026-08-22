import type { Metadata } from 'next';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';

import { Icon } from '../../../sprite-icon';
import { ManHinhBienSoan } from './man-hinh-bien-soan';
import '../../brand/brand.css';
import '../studio.css';
import './bien-soan.css';

export const metadata: Metadata = {
  title       : 'Biên soạn bài đăng — AI Content',
  description : 'Sinh và chỉnh sửa một bài đăng từ ý tưởng đã lưu.',
};

export default async function TrangBienSoan() {
  const workspaceId = await workspaceHienTai();
  const repo        = createRepo(workspaceId);
  const danhSach    = await repo.yTuong.listChiTiet();
  const yTuong      = danhSach.map((muc) => ({
    id     : muc.id,
    tieuDe : muc.tieuDe,
    beMat  : muc.beMat,
  }));

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-text" size={13} />
            Studio nội dung
          </span>
          <h1 className="page-title">Biên soạn bài đăng</h1>
          <p className="page-sub">
            Chọn một ý tưởng đã duyệt, để AI viết bản đầu rồi sửa lại bằng tiếng nói của bạn.
          </p>
        </div>
      </div>

      <ManHinhBienSoan yTuong={yTuong} />
    </>
  );
}
