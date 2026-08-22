import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { FormGiongDieu } from './form-giong-dieu';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import '../brand.css';

export const metadata: Metadata = {
  title: 'Giọng điệu & điều cấm kỵ — AI Content',
};

export const dynamic = 'force-dynamic';

export default async function TrangGiongDieu() {
  const repo = createRepo(await workspaceHienTai());
  // `layHoacTao` chu khong phai `lay`: nguoi dung mo trang lan dau van phai thay
  // bieu mau, khong phai mot man hinh trong.
  const hoSo = await repo.hoSo.layHoacTao();

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-text" size={13} />
            <Link href="/brand">Hồ sơ kênh</Link>
          </span>
          <h1 className="page-title">Giọng điệu &amp; điều cấm kỵ</h1>
          <p className="page-sub">
            Mọi bài hệ thống viết ra đều đi qua hai ô này. Điều cấm kỵ là thứ duy nhất chặn
            được câu làm hỏng uy tín kênh.
          </p>
        </div>
      </div>

      <section className="panel" aria-label="Giọng điệu và điều cấm kỵ">
        <FormGiongDieu
          hoSo={{
            moTa: hoSo.moTa,
            giongDieu: hoSo.giongDieu,
            dieuCamKy: hoSo.dieuCamKy,
            phongChu: hoSo.phongChu,
          }}
        />
      </section>
    </>
  );
}
