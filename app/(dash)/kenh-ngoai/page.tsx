import type { Metadata } from 'next';

import { Icon } from '../../sprite-icon';
import { BangKenhNgoai } from './bang-kenh-ngoai';
import { TRAN_BAI } from './dinh-dang-va-loc';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { createRepo } from '@/lib/data-access';
import '../brand/brand.css';
import '../studio/studio.css';
// Dung lai lop bang cua man "Bai da dang" thay vi chep CSS sang day.
import '../bai-da-dang/bai-da-dang.css';
import './kenh-ngoai.css';

export const metadata: Metadata = {
  title: 'Kênh ngoài kia — AI Content',
};

/**
 * Ten goi tam khi kenh chua co `ten_hien_thi`.
 *
 * CHEP tu `bang-kenh-theo-doi.tsx` chu khong import: tep do la `'use client'`,
 * moi thu no xuat ra deu thanh tham chieu phia trinh duyet — goi tu may chu se
 * no ngay luc chay.
 */
function tenKenhTuUrl(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/+|\/+$/g, '') || url;
  } catch {
    return url;
  }
}

export default async function TrangKenhNgoai() {
  const repo = createRepo(await workspaceHienTai());
  const nguoi = await nguoiDungHienTai();

  // Chi bai cua kenh NGUOI NAY tick theo doi. Ai theo cai nao thay cai do.
  const bai = await repo.tinHieuXuHuong.theoNguoiDungDeTraCuu(nguoi, TRAN_BAI);

  const dong = bai.map((b) => ({
    id: b.id,
    thoiDiem: b.thoiDiem ? b.thoiDiem.toISOString() : null,
    // `ten_hien_thi` thuong rong vi bo boc chua lay duoc ten — lay tu URL cho do trong.
    tenKenh: b.tenKenh ?? tenKenhTuUrl(b.urlKenh),
    urlKenh: b.urlKenh,
    noiDung: b.noiDung ?? '',
    // `trend_signals` khong luu so ky tu; dem tai day de bang co cot loc nhu ben kia.
    soKyTu: (b.noiDung ?? '').length,
    dangBai: b.dangBai,
    lienKet: b.lienKet,
    soThich: b.soThich,
    soBinhLuan: b.soBinhLuan,
    soChiaSe: b.soChiaSe,
    thoiLuongVideoMs: b.thoiLuongVideoMs,
  }));

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-trend" size={13} />
            Theo dõi
          </span>
          <h1 className="page-title">Kênh ngoài kia</h1>
          <p className="page-sub">
            Bài kéo về từ kênh bạn đang theo dõi. Máy học <strong>chủ đề và cách kể</strong>{' '}
            từ đây rồi đề xuất ý tưởng — không viết lại bài của họ. Mỗi cột có ô lọc riêng
            ngay dưới tiêu đề.
          </p>
        </div>
        <div className="page-head__nut">
          <a className="btn btn--primary btn--sm" href="/cai-dat/kenh">
            <Icon name="i-link" size={16} />
            Quản lý kênh theo dõi
          </a>
        </div>
      </div>

      <section className="panel" aria-label="Bài từ kênh ngoài">
        <BangKenhNgoai dong={dong} />
      </section>
    </>
  );
}
