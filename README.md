# AI Content — bài test tuyển dụng

Ứng dụng web giúp chủ shop nhỏ sản xuất nội dung mạng xã hội đều tay. Next.js
(App Router) + PostgreSQL + Drizzle.

Đề bài nằm ở **[`TEST-BRIEF.md`](TEST-BRIEF.md)**. Đọc file này trước để dựng
môi trường, rồi mở đề bài.

## Chạy trong 5 phút

```bash
npm ci

docker compose -f docker/postgres/compose.yml up -d

cp .env.example .env
# mở .env: điền AUTH_SECRET (openssl rand -hex 32) và GEMINI_API_KEY

npm run db:migrate

# Dữ liệu mẫu — chạy đúng thứ tự này, seed-test.sql phụ thuộc seed.sql
docker exec -i aicontent-test-postgres psql -U postgres -d aicontent_test < db/seed.sql
docker exec -i aicontent-test-postgres psql -U postgres -d aicontent_test < db/seed-test.sql

npm run dev
```

Mở `http://localhost:6980/api/dev-login` — vào thẳng, không cần Google.

Chạy được thì `/bai-da-dang` có 6 bài và `/kenh-ngoai` có 6 bài của hai kênh
đang theo dõi. Không thấy gì là seed chưa chạy hoặc chạy sai thứ tự.

Việc nền (sinh nội dung) chạy ở tiến trình riêng, mở thêm một cửa sổ:

```bash
node -r dotenv/config workers/model/index.js
```

## Kiểm trước khi nộp

```bash
npx tsc --noEmit
node --test tests/
npm run build
```

Cả ba phải xanh. Bộ test hiện có **225 ca đang xanh** — làm đỏ ca nào là hỏng
một ràng buộc có thật, không phải test khó tính.

Hai bộ quét đáng chú ý vì chúng chặn thứ không nhìn ra khi đọc diff:

- `tests/data-access-guard.test.cjs` — chặn mọi truy vấn đi vòng qua
  `lib/data-access/`. Đây là lá chắn chống rò dữ liệu giữa các khách hàng, không
  phải quy ước phong cách. Cần ngoại lệ thì khai tên tệp trong
  `tests/quet-tang-truy-cap.cjs`, đừng nới lỏng biểu thức.
- `tests/khong-lo-secret-ra-trinh-duyet.test.mjs` — chặn khoá lọt xuống client.

## Bản đồ mã nguồn

| Thư mục | Việc |
|---|---|
| `app/(dash)/` | Màn hình sau đăng nhập |
| `lib/data-access/` | **Cửa duy nhất** xuống cơ sở dữ liệu, mọi truy vấn ép theo `workspace_id` |
| `lib/model-runner/` | Lớp gọi mô hình: chọn bộ chạy, ghép lời nhắc, chạy, kiểm định dạng |
| `lib/queue/` | Hàng đợi việc nền |
| `lib/brand/` | Hồ sơ thương hiệu, bóc tách, quy tắc ngôn ngữ |
| `lib/keo-bai/` | Kéo bài từ nền tảng ngoài |
| `db/schema/` | Lược đồ Drizzle |
| `workers/` | Tiến trình nền |

Web app gọi mô hình qua **đúng một cửa**: `chayNhiemVu()` trong
`lib/model-runner/index.js`. Hàm đó đẩy việc vào bảng `jobs` rồi chờ worker
chạy — nó không tự gọi mô hình. Đừng gọi thẳng nhà cung cấp từ màn hình.

## Quy ước mã

- CommonJS ở `lib/model-runner`, `lib/queue`, `workers`; TypeScript ở phần còn lại
- Tên tệp kebab-case, mô tả rõ việc (`sinh-kich-ban.ts`, không phải `utils.ts`)
- `app/` xử lý HTTP và giao diện; `lib/` là nghiệp vụ thuần, không import `next`
- Tệp quá 200 dòng thì tách theo ranh giới nghiệp vụ
- Comment giải thích **tại sao**, không mô tả lại code
- Không tạo abstraction cho chỗ chỉ dùng một lần

Tên biến, tên hàm, tên cột trong repo này viết bằng tiếng Việt không dấu. Đó là
quy ước có chủ ý, không phải tai nạn — viết theo cho khớp.
