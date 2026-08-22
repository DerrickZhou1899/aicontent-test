'use client';

import { useMemo, useState } from 'react';
import { Icon } from '../../sprite-icon';
import {
  CONTENT_TEMPLATES,
  FORMAT_LABELS,
  type ContentTemplate,
  type TemplateFormat,
} from './content-template-samples';

type FilterValue = TemplateFormat | 'all';

const FILTERS: { value: FilterValue; label: string; icon?: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'image', label: FORMAT_LABELS.image.label, icon: FORMAT_LABELS.image.icon },
  { value: 'text', label: FORMAT_LABELS.text.label, icon: FORMAT_LABELS.text.icon },
  { value: 'mix', label: FORMAT_LABELS.mix.label, icon: FORMAT_LABELS.mix.icon },
  { value: 'script', label: FORMAT_LABELS.script.label, icon: FORMAT_LABELS.script.icon },
];

// Bỏ dấu để gõ "kich ban" vẫn ra "kịch bản".
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function previewText(template: ContentTemplate): string {
  return template.preview.map((part) => (typeof part === 'string' ? part : part.mark)).join('');
}

function searchIndex(template: ContentTemplate): string {
  return normalize(
    [
      template.keywords,
      template.title,
      previewText(template),
      template.pillar,
      FORMAT_LABELS[template.format].label,
    ].join(' '),
  );
}

export function TemplateGallery() {
  const [format, setFormat] = useState<FilterValue>('all');
  const [term, setTerm] = useState('');

  const indexed = useMemo(
    () => CONTENT_TEMPLATES.map((template) => ({ template, haystack: searchIndex(template) })),
    [],
  );

  const shown = useMemo(() => {
    const needle = normalize(term.trim());
    return indexed
      .filter(({ template, haystack }) => {
        const okFormat = format === 'all' || template.format === format;
        const okTerm = !needle || haystack.includes(needle);
        return okFormat && okTerm;
      })
      .map(({ template }) => template);
  }, [indexed, format, term]);

  function resetFilters() {
    setFormat('all');
    setTerm('');
  }

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <Icon name="i-search" size={17} />
          <label className="sr-only" htmlFor="q">Tìm mẫu nội dung</label>
          <input
            id="q"
            type="search"
            placeholder="Tìm theo tên mẫu hoặc trụ cột…"
            autoComplete="off"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>

        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            className="chip"
            type="button"
            aria-pressed={format === filter.value}
            onClick={() => setFormat(filter.value)}
          >
            {filter.icon ? <Icon name={filter.icon} size={15} /> : null}
            {filter.label}
          </button>
        ))}

        <span className="count" aria-live="polite">{shown.length}/{CONTENT_TEMPLATES.length} mẫu</span>
      </div>

      <div className="grid">
        {shown.map((template) => (
          <article key={template.id} className={`card card--${template.format}`}>
            <div className="card__top">
              <span className="badge">
                <Icon name={FORMAT_LABELS[template.format].icon} size={13} />
                {FORMAT_LABELS[template.format].label}
              </span>
              <span className="card__uses">{template.uses} lượt dùng</span>
            </div>
            <h3 className="card__title">{template.title}</h3>
            <p className="preview">
              {template.preview.map((part, index) =>
                typeof part === 'string' ? part : <mark key={index}>{part.mark}</mark>,
              )}
            </p>
            <div className="card__foot">
              <span className="pillar">{template.pillar}</span>
              <div className="card__actions">
                <button className="btn btn--ghost btn--sm btn--icon" type="button" aria-label="Xem trước mẫu">
                  <Icon name="i-eye" size={15} />
                </button>
                <button className="btn btn--primary btn--sm" type="button">Dùng mẫu</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="empty" data-visible={shown.length === 0}>
        <div className="empty__icon"><Icon name="i-search" size={26} /></div>
        <p className="empty__title">Không có mẫu nào khớp</p>
        <p className="empty__sub">Bỏ bớt bộ lọc hoặc đổi từ khoá. Nếu trụ cột của kênh chưa có mẫu phù hợp, tạo mẫu mới rồi lưu lại để dùng lần sau.</p>
        <button className="btn btn--ghost" type="button" onClick={resetFilters}>Xoá bộ lọc</button>
      </div>
    </>
  );
}
