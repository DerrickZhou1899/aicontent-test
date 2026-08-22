// Icon lấy từ sprite <symbol> nhúng trong trang (xem app/(dash)/icon-sprite.tsx).
// Component không có state nên dùng được cả ở server lẫn client component.

export function Icon({ name, size }: { name: string; size: number }) {
  return (
    <svg width={size} height={size}>
      <use href={`#${name}`} />
    </svg>
  );
}
