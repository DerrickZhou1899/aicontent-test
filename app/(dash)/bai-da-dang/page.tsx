import type { Metadata } from 'next';

import { Icon } from '../../sprite-icon';
import { BangBaiDaDang } from './bang-bai-da-dang';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import '../brand/brand.css';
import '../studio/studio.css';
import './bai-da-dang.css';

export const metadata: Metadata = {
  title: 'Bài đã đăng — AI Content',
};

export default async function TrangBaiDaDang() {
  const repo = createRepo(await workspaceHienTai());

  // Chi bai DA DANG keo tu kenh ve, khong lan sang ban nhap cua studio.
  const bai = await repo.contents.list({ trangThai: 'da_dang', gioiHan: 200 });
  const [asset, banTho] = await Promise.all([
    repo.asset.theoNoiDung(bai.map((b) => b.id)),
    repo.baiKeoTho.theoNhieuContentId(bai.map((b) => b.id)),
  ]);
  const soLieuTheoBai = new Map(banTho.map((t) => [t.contentId, t]));

  const theoBai = new Map<string, typeof asset>();
  for (const a of asset) {
    if (!a.contentId) continue;
    const co = theoBai.get(a.contentId) ?? [];
    co.push(a);
    theoBai.set(a.contentId, co);
  }

  const dong = bai.map((b) => {
    const cua = theoBai.get(b.id) ?? [];
    return {
      id: b.id,
      ngayDang: b.ngayDang ? b.ngayDang.toISOString() : null,
      noiDung: b.noiDung ?? '',
      soKyTu: b.soKyTu ?? 0,
      lienKetGoc: b.lienKetGoc,
      dangBai: b.dangBai,
      soThich: soLieuTheoBai.get(b.id)?.soThich ?? null,
      soBinhLuan: soLieuTheoBai.get(b.id)?.soBinhLuan ?? null,
      soChiaSe: soLieuTheoBai.get(b.id)?.soChiaSe ?? null,
      thoiLuongVideoMs: soLieuTheoBai.get(b.id)?.thoiLuongVideoMs ?? null,
      anh: cua
        .filter((a) => a.loai === 'anh')
        .map((a) => ({ id: a.id, duongDan: a.duongDan, urlNgoai: a.urlNgoai })),
      video: cua
        .filter((a) => a.loai === 'video')
        .map((a) => ({ id: a.id, urlNgoai: a.urlNgoai, phuDe: a.phuDe })),
    };
  });

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-folder" size={13} />
            Kho nội dung
          </span>
          <h1 className="page-title">Bài đã đăng</h1>
          <p className="page-sub">
            Bài kéo về từ kênh của bạn. Bấm vào nội dung để mở rộng xem ảnh, video và phụ đề.
            Mỗi cột có ô lọc riêng ngay dưới tiêu đề.
          </p>
        </div>
        <div className="page-head__nut">
          <a className="btn btn--primary btn--sm" href="/cai-dat/kenh">
            <Icon name="i-link" size={16} />
            Kéo thêm bài
          </a>
        </div>
      </div>

      <section className="panel" aria-label="Bài đã đăng">
        <BangBaiDaDang dong={dong} />
      </section>
    </>
  );
}
