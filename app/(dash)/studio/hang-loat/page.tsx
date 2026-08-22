import type { Metadata } from 'next';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';

import { Icon } from '../../../sprite-icon';
import { ManHinhHangLoat } from './man-hinh-hang-loat';
import '../../brand/brand.css';
import '../studio.css';

export const metadata: Metadata = {
  title       : 'Sinh hàng loạt — AI Content',
  description : 'Chọn ý tưởng và xếp hàng đợi sinh bài cho kế hoạch nội dung hôm nay.',
};

export default async function TrangHangLoat() {
  const workspaceId = await workspaceHienTai();
  const repo        = createRepo(workspaceId);
  const danhSach    = await repo.yTuong.listChiTiet();
  const yTuong      = danhSach
    .filter((muc) => !muc.daDung)
    .map(({ id, tieuDe, beMat }) => ({ id, tieuDe, beMat }));

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-sparkle" size={13} />
            Studio nội dung
          </span>
          <h1 className="page-title">Sinh hàng loạt</h1>
          <p className="page-sub">
            Chọn tối đa 10 ý tưởng để chuẩn bị một lô bài cho hôm nay.
          </p>
        </div>
      </div>

      <ManHinhHangLoat yTuong={yTuong} />
    </>
  );
}
