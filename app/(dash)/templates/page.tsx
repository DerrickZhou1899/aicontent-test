import type { Metadata } from 'next';
import { Icon } from '../../sprite-icon';
import { TemplateGallery } from './template-gallery';
import './content-templates-page.css';

export const metadata: Metadata = {
  title: 'Mẫu nội dung — AI Content',
  description:
    'Kho mẫu nội dung cho kênh social SANG 5M STUDIO: ảnh, text, ảnh + caption, kịch bản video.',
};

export default function ContentTemplatesPage() {
  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow"><Icon name="i-file" size={13} />Mẫu nội dung</span>
          <h1 className="page-title">Mẫu nội dung</h1>
          <p className="page-sub">Chọn mẫu, AI điền theo chân dung khách hàng và mô tả sản phẩm của kênh. Chỗ tô cam là phần hệ thống tự thay.</p>
        </div>
        <a className="btn btn--primary" href="#"><Icon name="i-plus" size={17} />Tạo mẫu mới</a>
      </div>

      <section className="stats" aria-label="Số liệu kho mẫu">
        <article className="stat stat--brand">
          <div className="stat__icon"><Icon name="i-file" size={19} /></div>
          <p className="stat__label">Tổng số mẫu</p>
          <p className="stat__value">47</p>
        </article>
        <article className="stat stat--sage">
          <div className="stat__icon"><Icon name="i-check" size={19} /></div>
          <p className="stat__label">Khớp trụ cột của kênh</p>
          <p className="stat__value">29</p>
        </article>
        <article className="stat stat--clay">
          <div className="stat__icon"><Icon name="i-film" size={19} /></div>
          <p className="stat__label">Kịch bản video</p>
          <p className="stat__value">13</p>
        </article>
        <article className="stat stat--plum">
          <div className="stat__icon"><Icon name="i-copy" size={19} /></div>
          <p className="stat__label">Đã dùng tuần này</p>
          <p className="stat__value">9</p>
        </article>
      </section>

      <section className="panel" aria-label="Danh sách mẫu">
        <TemplateGallery />
      </section>
    </>
  );
}
