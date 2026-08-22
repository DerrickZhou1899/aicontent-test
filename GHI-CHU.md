# Ghi chú triển khai

Đây là tài liệu xương sống của phần bài làm: ghi lại mục tiêu, phạm vi, luồng xử lý, quyết định kỹ thuật và trạng thái kiểm tra. Cách dựng môi trường vẫn theo `README.md`; yêu cầu và tiêu chí chấm vẫn theo `TEST-BRIEF.md`.

## Mục tiêu

Hoàn thiện luồng sản xuất nội dung từ dữ liệu có sẵn trong hệ thống:

1. Sinh và lưu ý tưởng có neo vào dữ liệu thật.
2. Từ một ý tưởng sinh bài đăng, cho phép chỉnh sửa và lưu bản nháp.
3. Từ một ý tưởng sinh kịch bản quay theo từng phân cảnh.
4. Mở rộng sang sinh hàng loạt và sinh ảnh sau khi ba mốc đầu ổn định.

Mục tiêu sử dụng cuối cùng là giúp chủ shop chuẩn bị đủ 10 bài Facebook mỗi ngày.

## Tiến độ

- [x] Nền tảng đề xuất ý tưởng và chuẩn hóa kết quả mô hình.
- [x] Payload tham khảo xu hướng an toàn, không gửi nguyên văn bài ngoài.
- [x] Schema, migration và repository lưu ý tưởng có nguồn.
- [x] Dịch vụ đề xuất ý tưởng từ dữ liệu thật đến bước lưu CSDL.
- [x] Chống lưu trùng khi nhiều request nhận cùng một job hoàn tất.
- [x] Giao diện gửi yêu cầu và hiển thị kết quả đề xuất.
- [x] Danh sách ý tưởng đã lưu và mở nguồn tham khảo.
- [x] Lời nhắc sinh bài bám ý tưởng, hồ sơ và ràng buộc độ dài.
- [x] Dịch vụ sinh bản nháp từ một ý tưởng trong workspace.
- [x] Giao diện chọn ý tưởng, sinh và chỉnh sửa bản nháp.
- [x] Sinh, chỉnh sửa và lưu bài đăng.
- [x] Lời nhắc và chuẩn hóa kết quả kịch bản phân cảnh.
- [ ] Sinh kịch bản quay theo từng phân cảnh.
- [ ] Sinh hàng loạt và sinh ảnh.

## Luồng đề xuất ý tưởng

1. Đọc hồ sơ thương hiệu, trụ cột, chân dung, insight và lịch sử kênh mình qua `lib/data-access/`.
2. Nếu có ngữ cảnh người dùng, đọc tín hiệu từ đúng các kênh người đó theo dõi.
3. Chỉ lấy chủ đề và công thức kể đã rút gọn; loại nguyên văn, payload thô và thông tin không thuộc allowlist.
4. Tạo các slot ổn định, trong đó 20% là khám phá và phần còn lại có thể neo vào nguồn tham khảo.
5. Gọi mô hình qua duy nhất `chayNhiemVu()` và khóa chống trùng theo payload đã chuẩn hóa.
6. Dọn kết quả, đối chiếu trụ cột và chân dung với dữ liệu thật, sau đó phân bổ theo tỉ lệ mục tiêu.
7. Gắn nguồn theo vị trí slot do mã kiểm soát, không tin metadata do mô hình trả về.
8. Claim job, lưu ý tưởng và đánh dấu nguồn đã dùng trong cùng một giao dịch.

## Quyết định kỹ thuật

- Mọi truy vấn đi qua `lib/data-access/` và luôn giới hạn theo `workspaceId`.
- Danh sách bài ngoài còn được giới hạn theo người dùng đang đăng nhập.
- Web app không gọi thẳng nhà cung cấp mô hình.
- Bảng `ideas` có cột `tieu_de` bắt buộc; migration backfill dữ liệu cũ trước khi đặt `NOT NULL`.
- Trụ cột hoặc chân dung không khớp dữ liệu thật được đặt thành `null`, không lưu tên do mô hình tự đặt.
- Nguồn và cờ khám phá thuộc quyền sở hữu của mã, không lấy từ kết quả mô hình.
- Khóa chống trùng dùng JSON chuẩn hóa để thứ tự key không tạo ra job khác nhau.
- Claim và insert cùng giao dịch để lỗi lưu có thể rollback và thử lại an toàn.
- Các truy vấn danh sách có `id DESC` làm tiêu chí phụ để thứ tự luôn xác định.

## Bản đồ thay đổi

- `db/schema/content.ts`, `db/migrations/0009_add_idea_title.sql`: tiêu đề bắt buộc cho ý tưởng.
- `lib/data-access/ideas.ts`: đọc ý tưởng kèm trụ cột, chân dung và nguồn.
- `lib/data-access/jobs.ts`: nhận quyền lưu kết quả của một job đúng một lần.
- `lib/data-access/tin-hieu-xu-huong.ts`: đọc nguồn theo người dùng và đánh dấu nguồn đã dùng.
- `lib/studio/du-lieu-de-xuat.ts`: dựng payload theo allowlist.
- `lib/studio/de-xuat-thuan.ts`: chuẩn hóa, tạo slot, phân bổ và chống trùng.
- `lib/studio/de-xuat-service.ts`: điều phối toàn bộ luồng đề xuất và lưu dữ liệu.
- `lib/studio/sinh-bai.ts`: dựng payload allowlist, gọi mô hình và dọn bản nháp bài đăng.
- `lib/studio/luu-bai.ts`: lưu bản đã duyệt và đánh dấu ý tưởng đã dùng trong cùng giao dịch.
- `lib/studio/sinh-kich-ban.ts`: dọn kết quả mô hình về danh sách phân cảnh quay được.
- `lib/model-runner/loi-nhac-xu-huong.js`: ràng buộc học công thức kể nhưng không sao chép bài nguồn.
- `lib/model-runner/loi-nhac-sinh-bai.js`: ràng buộc bài hoàn chỉnh bám dữ liệu thật và không lặp mạch.
- `lib/model-runner/loi-nhac-sinh-kich-ban.js`: ràng buộc thời lượng, hình ảnh và lời thoại từng cảnh.
- `app/(dash)/studio/de-xuat/`: gửi yêu cầu đề xuất và hiển thị kết quả để người dùng duyệt.
- `app/(dash)/studio/de-xuat/danh-sach-y-tuong.tsx`: hiển thị kho ý tưởng đã lưu và mở đúng bài nguồn.
- `app/(dash)/studio/bien-soan/`: chọn ý tưởng, sinh bản đầu và sửa trước khi lưu.
- `tests/`: kiểm tra hợp đồng, hành vi, cô lập workspace và rollback.

## Kết quả kiểm tra

Các kiểm tra đã chạy xanh trong môi trường hiện tại:

```sh
npx tsc --noEmit
node --test tests/studio-de-xuat.test.cjs tests/studio-de-xuat-slot.test.cjs tests/studio-de-xuat-service.test.cjs tests/studio-khong-chep-bai.test.cjs tests/model-runner-don-vi.test.js tests/jobs-claim-contract.test.cjs tests/y-tuong-co-nguon-contract.test.cjs
node --test tests/studio-de-xuat-ui-contract.test.cjs
node --test tests/studio-danh-sach-y-tuong-ui.test.cjs
node --test tests/loi-nhac-sinh-bai.test.cjs
node --test tests/studio-sinh-bai-service.test.cjs
node --test tests/studio-luu-bai-service.test.cjs
node --test tests/studio-bien-soan-ui.test.cjs
node --test tests/loi-nhac-kich-ban.test.cjs tests/studio-sinh-kich-ban.test.cjs
node --test tests/data-access-guard.test.cjs
```

Kết quả gần nhất: 75 test tính năng và hợp đồng, cùng 37 test data-access guard đều pass; TypeScript thoát mã 0. Next.js biên dịch production thành công.

## Giới hạn môi trường

- DB integration test chưa hoàn tất vì PostgreSQL tại `127.0.0.1:35443` chưa chạy trong môi trường hiện tại.
- Toàn bộ suite hiện có 225 test pass; các ca DB còn lại dừng vì PostgreSQL tại `127.0.0.1:35443` chưa chạy.
- Secret guard chạy xanh phần quét lời nhắc; phần quét khóa dừng đúng thiết kế vì chưa có `AUTH_SECRET` trong môi trường.
- Bước hậu xử lý build dùng `rm` và `cp` nên không chạy trên PowerShell; phần `next build` trước đó đã hoàn tất.
- Không thêm secret giả và không nới lỏng test để che các giới hạn trên.

## Việc tiếp theo

1. Dựng `.env`, PostgreSQL và chạy migration/seed theo `README.md`.
2. Chạy lại toàn bộ test, DB integration test và production build.
3. Dựng service đọc ý tưởng và gọi nhiệm vụ `viet-kich-ban` qua hàng đợi.
