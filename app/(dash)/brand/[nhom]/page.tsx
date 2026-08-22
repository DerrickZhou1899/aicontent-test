import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Icon } from '../../../sprite-icon';
import { DanhSachNhom } from './danh-sach-nhom';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { DAC_TA_NHOM, layDacTa } from '@/lib/brand/dac-ta-nhom';
import { createRepo } from '@/lib/data-access';
import '../brand.css';

export const dynamic = 'force-dynamic';

/** Bon slug hop le duoc biet truoc — moi duong dan khac tra 404. */
export function generateStaticParams() {
  return Object.keys(DAC_TA_NHOM).map((nhom) => ({ nhom }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nhom: string }>;
}): Promise<Metadata> {
  const { nhom } = await params;
  const dacTa = layDacTa(nhom);
  return { title: `${dacTa?.ten ?? 'Hồ sơ kênh'} — AI Content` };
}

export default async function TrangNhom({ params }: { params: Promise<{ nhom: string }> }) {
  const { nhom } = await params;
  const dacTa = layDacTa(nhom);
  if (!dacTa) notFound();

  const repo = createRepo(await workspaceHienTai());
  const danhSach = await repo[dacTa.repo].list();

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name={dacTa.icon} size={13} />
            <Link href="/brand">Hồ sơ kênh</Link>
          </span>
          <h1 className="page-title">{dacTa.ten}</h1>
          <p className="page-sub">{dacTa.moTa}</p>
        </div>
      </div>

      <section className="panel" aria-label={dacTa.ten}>
        <DanhSachNhom
          dacTa={dacTa}
          danhSach={danhSach as (Record<string, unknown> & { id: string })[]}
        />
      </section>
    </>
  );
}
