# Bài test — Máy đề xuất nội dung

Đọc [`README.md`](README.md) trước để dựng môi trường. File này là đề bài.

**Thời gian: 2–3 ngày.** Nộp bằng repo riêng + video ≤10 phút.

---

## 1. Bối cảnh

Người dùng sản phẩm này là chủ shop nhỏ. Họ biết mình cần đăng đều, nhưng mỗi
sáng ngồi trước màn hình trắng không biết viết gì. Mục tiêu của họ:
**đăng được 10 bài Facebook mỗi ngày mà không thuê thêm người.**

Việc của bạn là làm phần giúp họ đạt mục tiêu đó: từ dữ liệu đã có sẵn trong hệ
thống, sinh ra ý tưởng — rồi từ ý tưởng sinh ra nội dung, ảnh, và kịch bản quay
video.

## 2. Bốn nguồn đầu vào — đã có sẵn, không phải làm

Chạy seed xong là cả bốn đều có dữ liệu thật để đọc:

| Nguồn | Ở đâu | Xem trên giao diện |
|---|---|---|
| Insight khách hàng | `insights` · `lib/data-access/insights.ts` | — |
| Chân dung khách hàng | `personas` · `lib/data-access/personas.ts` | `/brand` |
| Hồ sơ thương hiệu + trụ cột nội dung | `brand_profiles`, `content_pillars` | `/brand` |
| Lịch sử bài đã đăng của kênh mình | `contents` (trạng thái `da_dang`) | `/bai-da-dang` |
| Lịch sử bài của người mình follow | `trend_signals` · `lib/data-access/tin-hieu-xu-huong.ts` | `/kenh-ngoai` |

Bạn **không cần** kéo dữ liệu từ Facebook/TikTok. Phần đó đã chạy rồi.

## 3. Việc cần làm

Năm mục dưới đây đang nằm trong thanh điều hướng bên trái và hiện đang **404** —
làm chúng chạy chính là bài test:

| Đường dẫn | Việc |
|---|---|
| `/studio/de-xuat` | Đề xuất ý tưởng hôm nay, từ 4 nguồn trên |
| `/studio/bien-soan` | Từ 1 ý tưởng → sinh nội dung bài đăng, sửa được |
| `/studio/chuoi-bai` | Chuỗi bài nối mạch, không lặp ý bài trước |
| `/studio/hang-loat` | Sinh nhiều bài một lượt (đây là chỗ phục vụ mốc 10 bài/ngày) |
| `/studio/so-giong` | So bốn giọng của bốn bề mặt cạnh nhau |

Cộng thêm hai đầu ra ngoài chữ:

- **Ảnh** cho bài đăng
- **Kịch bản quay video** — cấu trúc phân cảnh, không phải một đoạn văn

### Làm theo thứ tự này

Phạm vi đầy đủ ở trên **lớn hơn 2–3 ngày**. Điều đó là cố ý: chúng tôi muốn xem
bạn ưu tiên thế nào khi không đủ thời gian, chứ không chờ một bản hoàn chỉnh.

Làm theo đúng thứ tự dưới, làm xong mốc nào commit mốc đó. Dừng ở mốc 2 mà chắc
chắn thì hơn hẳn chạm cả 5 mốc mà không cái nào chạy.

1. **Đề xuất ý tưởng** — `/studio/de-xuat` sinh N ý tưởng, mỗi ý có lý do neo
   vào trụ cột và chân dung có thật, lưu lại được
2. **Sinh nội dung** — `/studio/bien-soan` từ 1 ý tưởng ra bài đăng hoàn chỉnh
3. **Kịch bản quay** — từ 1 ý tưởng ra kịch bản phân cảnh
4. **Sinh hàng loạt** — `/studio/hang-loat` phục vụ mốc 10 bài/ngày
5. **Ảnh** — sinh ảnh cho bài

Mốc 1 là bắt buộc. Không có nó thì không có gì để chấm.

## 4. Hợp đồng phải giữ đúng

Bộ chấm tự động chạy trên bài nộp của bạn và bám vào đúng những tên dưới đây.
Đổi tên là trượt phần chấm tự động, dù code chạy đúng.

**Tệp `lib/studio/de-xuat.ts` phải export:**

```ts
export const TI_LE_KHAM_PHA = 0.2;

export type ThamSoDeXuat = {
  workspaceId: string;
  beMat: BeMat;          // 'fanpage' | 'ho_so_ca_nhan' | 'tiktok' | 'zalo'
  soLuong: number;
};

export type TruCotMucTieu = { ten: string; tiLeMucTieu: number | null };

/** Dọn kết quả thô của mô hình về đúng hình dạng YTuongDeXuat[]. */
export function donKetQuaDeXuat(tho: unknown, /* ... */): YTuongDeXuat[];

/** Rải N ý tưởng theo tỉ lệ trụ cột mục tiêu. */
export function raiTheoTruCot(
  yTuongTho: YTuongDeXuat[],
  truCotMucTieu: TruCotMucTieu[],
  soLuong: number,
): YTuongDeXuat[];

/** Cửa chính: đọc hồ sơ, gọi mô hình, dọn, rải, trả kết quả. */
export async function deXuatYTuong(thamSo: ThamSoDeXuat): Promise<KetQuaStudio<YTuongDeXuat[]>>;
```

**Kiểu `YTuongDeXuat`** (đặt ở `lib/studio/kieu.ts`):

```ts
export type YTuongDeXuat = {
  tieuDe: string;
  truCot: string | null;      // phải khớp một trụ cột CÓ THẬT trong hồ sơ
  chanDung: string | null;    // phải khớp một chân dung CÓ THẬT trong hồ sơ
  gocTiepCan: string | null;
  cauMoDau: string | null;
  lyDoDeXuat: string | null;
  beMat: BeMat;
  khamPha: boolean;           // ý tưởng dò đường, thuộc tuyến chưa có dữ liệu
};
```

Ba tệp `lib/model-runner/loi-nhac-theo-nhiem-vu.js`,
`lib/model-runner/loi-nhac-xu-huong.js` có sẵn khung và `TODO(bai-test)` — phần
`truongBatBuoc` và dòng `Cau truc:` là hợp đồng đã chốt, phần chỉ dẫn cho mô
hình là chỗ bạn viết. Bốn nhiệm vụ khác trong file đó đã viết sẵn, đọc để biết
nhà này viết lời nhắc theo kiểu gì.

## 5. Ràng buộc bắt buộc

Bốn điều dưới đây được chấm nặng hơn số lượng tính năng làm xong:

1. **Mọi truy vấn đi qua `lib/data-access/`.** Bộ quét
   `tests/data-access-guard.test.cjs` chặn đường vòng. Đây là lá chắn chống rò
   dữ liệu giữa các khách hàng.
2. **Không bịa trụ cột và chân dung.** Mô hình trả về tên không khớp hồ sơ thì
   phải đặt `null`, không được tự thêm một tên mới vào hệ thống.
3. **Học cách kể, không chép bài.** Với bài của kênh mình follow: được mượn
   **chủ đề** và **công thức kể** (kiểu hook, độ dài, dạng bài). Không được đưa
   nguyên văn bài của họ vào lời nhắc, và giọng phải là giọng thương hiệu trong
   hồ sơ. Ràng buộc này phải ép ở **tầng mã**, không phải chỉ nhắc mô hình bằng
   chữ — hàm dựng lời nhắc không nên nhận được tham số chứa nội dung bài gốc.
4. **Mỗi ý tưởng sinh từ tham khảo phải trỏ về đúng bài đã gợi ý nó.** Người
   dùng cần bấm vào xem được nguồn.

Và: **web app không gọi thẳng nhà cung cấp mô hình.** Đi qua `chayNhiemVu()`
trong `lib/model-runner/index.js` — hàm đó đẩy việc vào hàng đợi cho worker chạy.

## 6. Cách nộp

1. Bấm **"Use this template" → Create a new repository** ở đầu trang repo này,
   đặt ở chế độ **Private**. Đừng fork — fork của repo private không tách khỏi
   repo gốc, bạn sẽ vướng quyền khi đẩy code.
2. Commit theo từng mốc, đừng dồn một commit cuối — chúng tôi đọc lịch sử commit
3. Thêm một tệp `GHI-CHU.md` ở gốc: làm được tới mốc mấy, chỗ nào bỏ dở và vì
   sao, quyết định nào bạn phân vân
4. Mời tài khoản GitHub **`SaLyTV`** vào repo của bạn (Settings → Collaborators)
5. Quay video ≤10 phút: demo chạy thật + giải thích **một** quyết định kỹ thuật
   khó nhất bạn gặp và vì sao chọn hướng đó

Trước khi nộp, chạy lại ba lệnh ở mục "Kiểm trước khi nộp" trong README. Cả ba
phải xanh.

## 7. Chấm thế nào

| Mục | Trọng số |
|---|---|
| Bộ chấm tự động chạy trên hợp đồng ở mục 4 | 30% |
| Bốn ràng buộc ở mục 5 | 30% |
| Chất lượng lời nhắc — ý tưởng sinh ra có dùng được không | 20% |
| Đi được tới mốc mấy | 10% |
| Video + `GHI-CHU.md`: giải thích được quyết định của mình | 10% |

Số tính năng làm xong chiếm ít điểm nhất **có chủ ý**. Chúng tôi tuyển người
viết được phần mềm chạy đúng và giải thích được vì sao mình làm thế, không tuyển
người chạy nhanh nhất.

## 8. Được dùng AI không?

Được, và cứ dùng thoải mái. Nhưng phần giải thích trong video là do bạn nói —
đây là chỗ chúng tôi phân biệt người hiểu việc mình làm với người dán code vào
rồi hy vọng nó chạy.

Có gì không rõ thì hỏi, đừng đoán. Câu hỏi tốt được tính là điểm cộng.
