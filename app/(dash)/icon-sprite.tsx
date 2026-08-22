// Bộ icon dùng chung, nhúng thẳng vào trang để không phải tải thư viện ngoài.
// Nội dung giữ nguyên từ bản HTML tĩnh; chỉ đổi tên thuộc tính cho hợp JSX.

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <symbol id="i-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9.5 6 6 6-6"/></symbol>
      {/* Sliders thay cho bánh răng: cạnh nút dark-mode, bánh răng tia dễ bị đọc nhầm thành mặt trời. */}
      <symbol id="i-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h4.4M13.6 8H20M4 16h9.4M18.6 16H20"/><circle cx="11" cy="8" r="2.6"/><circle cx="16" cy="16" r="2.6"/></symbol>
      <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9.4a6 6 0 1 0-12 0c0 4.8-2 6.3-2 6.3h16s-2-1.5-2-6.3Z"/><path d="M10.3 19a2 2 0 0 0 3.4 0"/></symbol>
      <symbol id="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.6A8.6 8.6 0 0 1 9.4 4 8.6 8.6 0 1 0 20 14.6Z"/></symbol>
      <symbol id="i-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
      <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.9-3.9"/></symbol>
      <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5.5v13M5.5 12h13"/></symbol>
      <symbol id="i-dots" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5.5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18.5" r="1.5"/></symbol>
      <symbol id="i-person" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8.4" r="3.6"/><path d="M4.9 20a7.2 7.2 0 0 1 14.2 0"/></symbol>
      <symbol id="i-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.9 20.4 7v10L12 21.1 3.6 17V7Z"/><path d="M3.6 7 12 11.3 20.4 7M12 11.3v9.8"/></symbol>
      <symbol id="i-pillars" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3.4" y="4.2" width="4.6" height="15.6" rx="1.5"/><rect x="9.7" y="4.2" width="4.6" height="15.6" rx="1.5"/><rect x="16" y="4.2" width="4.6" height="15.6" rx="1.5"/></symbol>
      <symbol id="i-sparkle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4.2 12.8 9.6 18.2 11.4 12.8 13.2 11 18.6 9.2 13.2 3.8 11.4 9.2 9.6Z"/><path d="M18.4 3.4v3.6M20.2 5.2h-3.6"/></symbol>
      <symbol id="i-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13.4 3.3H7.3a2.2 2.2 0 0 0-2.2 2.2v13.1a2.2 2.2 0 0 0 2.2 2.2h9.4a2.2 2.2 0 0 0 2.2-2.2V8.5Z"/><path d="M13.4 3.3v5.2h5.5M8.5 13.2h7M8.5 16.7h4.6"/></symbol>
      <symbol id="i-folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.4 6.7a2 2 0 0 1 2-2h3.3l2 2.6h7.9a2 2 0 0 1 2 2v8.1a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2Z"/></symbol>
      <symbol id="i-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5.2" width="17" height="15.3" rx="2.2"/><path d="M3.5 9.8h17M8.4 3.4v3.4M15.6 3.4v3.4"/></symbol>
      <symbol id="i-trend" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3.6 16.6 5.7-5.7 3.6 3.6 7.5-7.5"/><path d="M15.6 7h4.8v4.8"/></symbol>
      <symbol id="i-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.2 13.8a3.6 3.6 0 0 0 5.3.3l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.5 1.5"/><path d="M13.8 10.2a3.6 3.6 0 0 0-5.3-.3l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.5-1.5"/></symbol>
      <symbol id="i-card" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.9" y="5.4" width="18.2" height="13.2" rx="2.4"/><path d="M2.9 10.1h18.2M6.6 14.8h3.5"/></symbol>
      <symbol id="i-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.7 9.5a2.4 2.4 0 1 1 3.2 2.3c-.6.2-.9.8-.9 1.4v.4"/><path d="M12 16.6h.01"/></symbol>
      <symbol id="i-image" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.4" y="4.7" width="17.2" height="14.6" rx="2.4"/><circle cx="8.8" cy="9.9" r="1.6"/><path d="m4 17.4 4.7-4.2a2 2 0 0 1 2.7 0l4.8 4.4"/></symbol>
      <symbol id="i-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4.6 6.6h14.8M4.6 11h14.8M4.6 15.4h9.4M4.6 19.8h6"/></symbol>
      <symbol id="i-layers" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.4 3.7 7.5 12 11.6l8.3-4.1Z"/><path d="m3.7 12.3 8.3 4.1 8.3-4.1M3.7 16.8l8.3 4.1 8.3-4.1"/></symbol>
      <symbol id="i-film" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.2" y="5" width="17.6" height="14" rx="2.4"/><path d="M3.2 9.7h17.6M3.2 14.3h17.6M7.8 5v14M16.2 5v14"/></symbol>
      <symbol id="i-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8.6" y="8.6" width="11.8" height="11.8" rx="2.2"/><path d="M15.4 5.6a2.2 2.2 0 0 0-2.2-2.2H5.8a2.2 2.2 0 0 0-2.2 2.2v7.4a2.2 2.2 0 0 0 2.2 2.2"/></symbol>
      <symbol id="i-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.7 12S6.3 5.7 12 5.7 21.3 12 21.3 12 17.7 18.3 12 18.3 2.7 12 2.7 12Z"/><circle cx="12" cy="12" r="3.1"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6.6-10.4 10.5L4.5 12"/></symbol>
      <symbol id="i-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.6v5M12 16.2h.01"/></symbol>
    </svg>
  );
}
