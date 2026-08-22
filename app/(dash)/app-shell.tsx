'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '../sprite-icon';
import './app-shell.css';

type Theme = 'light' | 'dark';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Khởi tạo 'light' cho khớp HTML server dựng ra; giá trị thật do script trong
  // <head> đặt lên <html data-theme> trước khi hydrate, đọc lại ở effect dưới.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem('aicontent-theme', next);
    } catch {
      // Chế độ riêng tư chặn localStorage — vẫn đổi được theme cho phiên hiện tại.
    }
  }

  return (
    <div className="app" data-drawer={drawerOpen ? 'open' : 'closed'}>
      <aside className="sidebar" id="sidebar">
        <div className="biz">
          <div className="biz__mark" aria-hidden="true">S5</div>
          <div className="biz__text">
            <div className="biz__eyebrow">Kênh đang quản lý</div>
            <div className="biz__name">SANG 5M STUDIO</div>
          </div>
          <button className="icon-btn" type="button" aria-label="Đổi kênh"><Icon name="i-chevron" size={18} /></button>
          <button className="icon-btn" type="button" aria-label="Cài đặt kênh"><Icon name="i-gear" size={18} /></button>
        </div>

        <nav className="nav" aria-label="Điều hướng chính">
          <p className="nav__group">Hồ sơ kênh</p>
          <Link className="nav__link" href="/brand"><Icon name="i-layers" size={18} />Tổng quan hồ sơ</Link>
          <Link className="nav__link" href="/brand/chan-dung"><Icon name="i-person" size={18} />Chân dung khách hàng</Link>
          <Link className="nav__link" href="/brand/san-pham"><Icon name="i-box" size={18} />Sản phẩm &amp; dịch vụ</Link>
          <Link className="nav__link" href="/brand/tru-cot"><Icon name="i-pillars" size={18} />Trụ cột nội dung</Link>
          <Link className="nav__link" href="/brand/insight"><Icon name="i-sparkle" size={18} />Insight</Link>
          <Link className="nav__link" href="/brand/giong-dieu"><Icon name="i-text" size={18} />Giọng điệu &amp; cấm kỵ</Link>

          <p className="nav__group">Nội dung</p>
          <Link className="nav__link" href="/studio/de-xuat"><Icon name="i-sparkle" size={18} />Đề xuất hôm nay</Link>
          <Link className="nav__link" href="/studio/bien-soan"><Icon name="i-text" size={18} />Biên soạn</Link>
          <Link className="nav__link" href="/studio/chuoi-bai"><Icon name="i-layers" size={18} />Chuỗi bài</Link>
          <Link className="nav__link" href="/studio/hang-loat"><Icon name="i-copy" size={18} />Sinh hàng loạt</Link>
          <Link className="nav__link" href="/studio/so-giong"><Icon name="i-eye" size={18} />So 4 giọng</Link>
          <Link className="nav__link" href="/templates" aria-current="page"><Icon name="i-file" size={18} />Mẫu nội dung</Link>
          <a className="nav__link" href="#"><Icon name="i-folder" size={18} />Bài đã tạo</a>
          <Link className="nav__link" href="/bai-da-dang"><Icon name="i-file" size={18} />Bài đã đăng</Link>
          <Link className="nav__link" href="/kenh-ngoai"><Icon name="i-trend" size={18} />Kênh ngoài kia</Link>
          <span className="nav__link nav__link--soon"><Icon name="i-calendar" size={18} />Lịch đăng<span className="nav__soon">SẮP CÓ</span></span>

          <p className="nav__group">Khám phá</p>
          <a className="nav__link" href="#"><Icon name="i-trend" size={18} />Trend &amp; sự kiện</a>

          <p className="nav__group">Hệ thống</p>
          <Link className="nav__link" href="/cai-dat/kenh"><Icon name="i-link" size={18} />Kết nối kênh</Link>
          <a className="nav__link" href="#"><Icon name="i-card" size={18} />Gói cước</a>
          <a className="nav__link" href="#"><Icon name="i-help" size={18} />Hướng dẫn</a>
        </nav>

        <div className="side-foot">
          <div className="user">
            {/* Ghi cứng cho tới khi có màn tài khoản thật — đọc tên/email từ
                phiên đăng nhập là việc của phase sau, không thuộc bài test. */}
            <div className="user__avatar" aria-hidden="true">NS</div>
            <div className="user__text">
              <div className="user__name">Nhân sự nội dung</div>
              <div className="user__mail">seed@aicontent.local</div>
            </div>
            <button className="icon-btn" type="button" aria-label="Tuỳ chọn tài khoản"><Icon name="i-dots" size={18} /></button>
          </div>

          <div className="credit">
            <div className="credit__row">
              <span className="credit__label">Tín dụng AI tháng này</span>
              <span className="credit__value"><b>1.240</b>/3.000</span>
            </div>
            <div className="credit__bar"><div className="credit__fill" style={{ width: '41%' }} /></div>
          </div>
        </div>
      </aside>

      <button className="scrim" type="button" aria-label="Đóng menu" tabIndex={-1} onClick={() => setDrawerOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn topbar__burger"
            type="button"
            aria-controls="sidebar"
            aria-expanded={drawerOpen}
            aria-label="Mở menu"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            <Icon name="i-menu" size={20} />
          </button>

          <div className="marquee" aria-hidden="true">
            <div className="marquee__track">
              <span>Bản v1 — module quét trend đang chạy thử, dữ liệu cập nhật 2 lần mỗi ngày. Mẫu mới cho nhóm kịch bản video sẽ bổ sung trong tuần này.</span>
              <span>Bản v1 — module quét trend đang chạy thử, dữ liệu cập nhật 2 lần mỗi ngày. Mẫu mới cho nhóm kịch bản video sẽ bổ sung trong tuần này.</span>
            </div>
          </div>

          <span className="chip-note"><Icon name="i-alert" size={14} />Bản v1 · đang hoàn thiện</span>
          <button className="icon-btn icon-btn--dot" type="button" aria-label="Thông báo"><Icon name="i-bell" size={19} /></button>
          <button
            className="icon-btn"
            type="button"
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            onClick={toggleTheme}
          >
            <Icon name="i-moon" size={19} />
          </button>
        </header>

        <div className="notice">
          <div className="notice__text">
            <div className="notice__title">Gói dùng thử còn 5 ngày</div>
            <p className="notice__sub">Hết hạn thì đề xuất nội dung hằng ngày sẽ tạm dừng, mẫu đã lưu vẫn giữ nguyên.</p>
          </div>
          <a className="btn btn--primary btn--sm" href="#">Xem các gói</a>
        </div>

        <main className="canvas">{children}</main>
      </div>
    </div>
  );
}
