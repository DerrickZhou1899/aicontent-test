# Ghi chú triển khai

Đây là tài liệu xương sống của phần bài làm: ghi lại mục tiêu, phạm vi, luồng xử lý, quyết định kỹ thuật và trạng thái kiểm tra. Cách dựng môi trường vẫn theo `README.md`; yêu cầu và tiêu chí chấm vẫn theo `TEST-BRIEF.md`.

## Mục tiêu

Hoàn thiện luồng sản xuất nội dung từ dữ liệu có sẵn trong hệ thống:

1. Sinh và lưu ý tưởng có neo vào dữ liệu thật.
2. Từ một ý tưởng sinh bài đăng, cho phép chỉnh sửa và lưu bản nháp.
3. Từ một ý tưởng sinh kịch bản quay theo từng phân cảnh.
4. Mở rộng sang tạo hàng loạt và tạo ảnh sau khi ba mốc đầu ổn định.

Mục tiêu sử dụng cuối cùng là giúp chủ shop chuẩn bị đủ 10 bài Facebook mỗi ngày.

## Tiến độ

- [x] Nền tảng đề xuất ý tưởng và chuẩn hóa kết quả mô hình.
- [x] Payload tham khảo xu hướng an toàn, không gửi nguyên văn bài ngoài.
- [x] Schema, migration và repository lưu ý tưởng có nguồn.
- [x] Dịch vụ đề xuất ý tưởng từ dữ liệu thật đến bước lưu CSDL.
- [x] Chống lưu trùng khi nhiều request nhận cùng một job hoàn tất.
- [x] Giao diện gửi yêu cầu và hiển thị kết quả đề xuất.
- [x] Danh sách ý tưởng đã lưu và mở nguồn tham khảo.
- [x] Xóa nhanh ý tưởng chưa dùng mà không vượt phạm vi workspace.
- [x] Lời nhắc sinh bài bám ý tưởng, hồ sơ và ràng buộc độ dài.
- [x] Dịch vụ sinh bản nháp từ một ý tưởng trong workspace.
- [x] Giao diện chọn ý tưởng, sinh và chỉnh sửa bản nháp.
- [x] Sinh, chỉnh sửa và lưu bài đăng.
- [x] Lời nhắc và chuẩn hóa kết quả kịch bản phân cảnh.
- [x] Dịch vụ sinh kịch bản từ một ý tưởng trong workspace.
- [x] Action máy chủ sinh kịch bản lấy workspace từ phiên đăng nhập.
- [x] Sinh và hiển thị kịch bản quay theo từng phân cảnh.
- [x] Chỉnh sửa từng phân cảnh và lưu kịch bản vào kho nội dung.
- [x] Xếp tối đa 10 job sinh bài một lượt, không chờ trong request.
- [x] Đọc trạng thái cả lô theo workspace và hiển thị bằng câu tiếng Việt dễ hiểu.
- [x] Action xếp lô và đọc tiến độ luôn lấy workspace từ phiên đăng nhập.
- [x] Trang chọn tối đa 10 ý tưởng chưa dùng và hiển thị các job vừa xếp.
- [x] Tự động đọc tiến độ đến khi cả lô kết thúc và hiển thị bài hoàn tất.
- [x] Tạo hàng loạt.
- [x] Lưu tối đa 10 bản nháp trong một giao dịch, không để lại lô lưu dở.
- [x] Xem lại bản nháp đã lưu tại `/bai-da-tao` và mở trang này từ kết quả hàng loạt.
- [x] Đăng ký nhiệm vụ sinh ảnh qua hàng đợi và tách khỏi worker văn bản.
- [x] Xếp job tạo ảnh cho bài đã lưu và đọc trạng thái theo workspace.
- [x] Worker gọi Gemini, lưu byte ảnh vào kho media và tạo asset cho bài.
- [x] Giao diện tự theo dõi job và hiển thị ảnh qua tuyến media có kiểm quyền.
- [x] Sinh ảnh.

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
- Worker ảnh đọc lại nội dung theo workspace; payload job chỉ chứa `contentId` và tỉ lệ ảnh.
- Lần retry tái sử dụng asset cùng đường dẫn để không tạo dòng trùng khi job chưa kịp đánh dấu hoàn tất.
- Byte ảnh nằm trong kho media, bảng `assets` chỉ giữ đường dẫn tương đối và metadata.
- Bảng `ideas` có cột `tieu_de` bắt buộc; migration backfill dữ liệu cũ trước khi đặt `NOT NULL`.
- Trụ cột hoặc chân dung không khớp dữ liệu thật được đặt thành `null`, không lưu tên do mô hình tự đặt.
- Nguồn và cờ khám phá thuộc quyền sở hữu của mã, không lấy từ kết quả mô hình.
- Khóa chống trùng dùng JSON chuẩn hóa để thứ tự key không tạo ra job khác nhau.
- Lô sinh bài thêm `ideaId` vào khóa chống trùng, không thêm ID vào payload gửi mô hình.
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
- `lib/studio/sinh-hang-loat.ts`: kiểm tra lô ý tưởng và xếp từng job sinh bài độc lập.
- `lib/studio/trang-thai-hang-loat.ts`: đọc trạng thái job theo lô và dọn các bài đã hoàn tất.
- `lib/studio/luu-bai.ts`: lưu bản đã duyệt và đánh dấu ý tưởng đã dùng trong cùng giao dịch.
- `lib/studio/sinh-kich-ban.ts`: dựng payload allowlist, gọi mô hình và dọn danh sách phân cảnh.
- `lib/model-runner/loi-nhac-xu-huong.js`: ràng buộc học công thức kể nhưng không sao chép bài nguồn.
- `lib/model-runner/loi-nhac-sinh-bai.js`: ràng buộc bài hoàn chỉnh bám dữ liệu thật và không lặp mạch.
- `lib/model-runner/loi-nhac-sinh-kich-ban.js`: ràng buộc thời lượng, hình ảnh và lời thoại từng cảnh.
- `lib/model-runner/chon-mo-hinh.js`: định tuyến nhiệm vụ sinh ảnh sang worker API riêng.
- `workers/model/index.js`: chỉ nhận nhiệm vụ văn bản, không claim job sinh ảnh.
- `lib/studio/sinh-anh.ts`: xếp job và dọn trạng thái ảnh theo workspace.
- `workers/image/`: gọi Gemini, lưu file, tạo asset và chạy vòng lặp riêng cho job ảnh.
- `app/(dash)/studio/de-xuat/`: gửi yêu cầu đề xuất và hiển thị kết quả để người dùng duyệt.
- `app/(dash)/studio/de-xuat/danh-sach-y-tuong.tsx`: hiển thị kho ý tưởng đã lưu và mở đúng bài nguồn.
- `app/(dash)/studio/de-xuat/nut-xoa-y-tuong.tsx`: xác nhận và xóa nhanh ý tưởng chưa dùng.
- `app/(dash)/studio/bien-soan/`: chọn ý tưởng, sinh bản đầu, sửa bài và gọi sinh kịch bản.
- `app/(dash)/studio/bien-soan/xem-kich-ban.tsx`: chọn thời lượng và hiển thị khung hình, lời thoại từng cảnh.
- `app/(dash)/studio/bien-soan/xem-anh.tsx`: xếp job, hỏi tiến độ và hiển thị ảnh của bài đã lưu.
- `app/(dash)/studio/hang-loat/actions.ts`: nối service xếp lô và đọc trạng thái với workspace trong phiên.
- `app/(dash)/studio/hang-loat/page.tsx`: đọc ý tưởng chưa dùng của workspace để chuẩn bị lô.
- `app/(dash)/studio/hang-loat/man-hinh-hang-loat.tsx`: giới hạn lựa chọn, hỏi tiến độ và hiển thị bài hoàn tất.
- `lib/studio/sua-ban-nhap.ts`: chỉ cho sửa bản nháp thuộc workspace hiện tại và cập nhật lại câu mở đầu.
- `app/(dash)/bai-da-tao/`: tách bản nháp thành thẻ, mở trang chỉnh sửa và dùng lại luồng tạo ảnh đã có.
- `tests/`: kiểm tra hợp đồng, hành vi, cô lập workspace và rollback.

## Kết quả kiểm tra

Môi trường kiểm tra tích hợp dùng PostgreSQL 17.11 trong Docker tại `127.0.0.1:35443`. Migration và hai tệp seed đã chạy đúng thứ tự; dữ liệu kiểm tra có 6 bài đã đăng và 6 tín hiệu từ kênh theo dõi.

```sh
node node_modules/typescript/bin/tsc --noEmit
node --test <toàn bộ tệp *.test.* trong tests/>
node node_modules/next/dist/bin/next build
```

Kết quả gần nhất: `319/319` test pass, không bỏ qua ca nào; TypeScript và production build đều thoát mã 0. Các ca HTTP dùng `AICONTENT_TEST_URL=http://127.0.0.1:6980` để khớp địa chỉ IPv4 của máy chủ kiểm tra trên Windows.

## Giới hạn môi trường

- Gemini 3.6 Flash đã sinh JSON thật thành công. Luồng ảnh đã gọi Gemini 3.1 Flash Image nhưng nhận `429` vì model ảnh không có Free Tier; video demo bỏ qua đầu ra ảnh, không coi đây là lỗi hàng đợi.
- Build còn cảnh báo Turbopack về đường dẫn filesystem động trong `lib/keo-bai/kho-anh.ts`, nhưng không làm thất bại bản build.

## Việc tiếp theo

1. Rà soát thủ công luồng tạo hàng loạt, mở bản nháp và lưu nội dung đã sửa trên dữ liệu seed.
2. Chỉ chạy lại worker ảnh khi dự án Gemini đã bật billing.
