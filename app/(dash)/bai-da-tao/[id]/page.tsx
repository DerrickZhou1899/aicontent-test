import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';

import { Icon } from '../../../sprite-icon';
import '../../brand/brand.css';
import '../../studio/bien-soan/bien-soan.css';
import '../bai-da-tao.css';
import { TrinhSuaBanNhap } from './trinh-sua-ban-nhap';

export const metadata: Metadata = {
  title : 'Chỉnh sửa bản nháp — AI Content',
};

export default async function TrangChiTietBanNhap({
  params,
}: {
  params : Promise<{ id: string }>;
}) {
  const { id }   = await params;
  const repo     = createRepo(await workspaceHienTai());
  const banNhap  = await repo.contents.layBanNhapChiTietTheoId(id);
  if (!banNhap || banNhap.trangThai !== 'ban_nhap') notFound();

  const assets = await repo.asset.theoNoiDung([id]);
  const anh    = assets.find((muc) => muc.loai === 'anh' && muc.duongDan);
  const anhBanDau = anh?.duongDan ? {
    assetId  : anh.id,
    duongDan : anh.duongDan,
    tiLe     : '1:1' as const,
  } : null;

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow"><Icon name="i-file" size={13} />Bản nháp đã lưu</span>
          <h1 className="page-title">Hoàn thiện bài đăng</h1>
          <p className="page-sub">Chỉnh nội dung và tạo ảnh trước khi đưa bài vào lịch đăng.</p>
        </div>
      </div>
      <TrinhSuaBanNhap
        banNhap={{
          id             : banNhap.id,
          tieuDeYTuong   : banNhap.tieuDeYTuong,
          noiDung        : banNhap.noiDung ?? '',
        }}
        anhBanDau={anhBanDau}
      />
    </>
  );
}
