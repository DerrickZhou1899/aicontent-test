// Dữ liệu mẫu nội dung cho bản demo — chưa có bảng trong database.
// Phase sau thay bằng truy vấn thật, giữ nguyên hình dạng `ContentTemplate`.

export type TemplateFormat = 'image' | 'text' | 'mix' | 'script';

// Đoạn `{ mark }` là chỗ AI điền theo hồ sơ kênh, trang tô cam bằng thẻ <mark>.
export type PreviewPart = string | { mark: string };

export type ContentTemplate = {
  id: string;
  format: TemplateFormat;
  /** Từ khoá không dấu để gõ "kich ban" vẫn tìm ra "kịch bản". */
  keywords: string;
  uses: number;
  title: string;
  preview: PreviewPart[];
  pillar: string;
};

export const FORMAT_LABELS: Record<TemplateFormat, { label: string; icon: string }> = {
  image: { label: 'Ảnh', icon: 'i-image' },
  text: { label: 'Text', icon: 'i-text' },
  mix: { label: 'Ảnh + caption', icon: 'i-layers' },
  script: { label: 'Kịch bản video', icon: 'i-film' },
};

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'hook-3-giay-noi-dau-dung-video',
    format: 'script',
    keywords: 'hook noi dau dung video kich ban',
    uses: 34,
    title: 'Hook 3 giây: nỗi đau ngồi dựng video tới 2 giờ sáng',
    preview: [
      'Cảnh 1 (0–3s) quay màn hình timeline rối. Lời thoại: “Bạn mất ',
      { mark: 'số giờ' },
      ' cho một clip ',
      { mark: 'độ dài' },
      '?” Cảnh 2 chuyển sang thao tác nhanh bằng ',
      { mark: 'tên sản phẩm' },
      '.',
    ],
    pillar: 'Nỗi đau nghề · 45–60s',
  },
  {
    id: 'truoc-sau-12-clip-mot-buoi-chieu',
    format: 'mix',
    keywords: 'truoc sau 12 clip buoi chieu chung minh san pham',
    uses: 28,
    title: 'Trước / sau: 12 clip trong một buổi chiều',
    preview: [
      'Ảnh ghép hai khung. Caption: “Trước: ',
      { mark: 'quy trình cũ' },
      '. Sau khi dùng ',
      { mark: 'tên sản phẩm' },
      ': còn ',
      { mark: 'thời gian mới' },
      '.” Chốt bằng lời mời dùng thử.',
    ],
    pillar: 'Chứng minh sản phẩm',
  },
  {
    id: 'checklist-7-loi-nguoi-moi-dung-video',
    format: 'text',
    keywords: 'checklist 7 loi dung video nguoi moi kien thuc',
    uses: 41,
    title: 'Checklist 7 lỗi người mới hay mắc khi dựng video',
    preview: [
      'Mở bài chạm đúng ',
      { mark: 'nỗi đau chính' },
      ' của chân dung khách. Bảy gạch đầu dòng, mỗi lỗi một câu. Chốt: mời tải ',
      { mark: 'tài nguyên tặng' },
      '.',
    ],
    pillar: 'Kiến thức miễn phí',
  },
  {
    id: 'anh-khoe-chi-so-hoc-vien-30-ngay',
    format: 'image',
    keywords: 'hoc vien khoe kenh 30 ngay bang chung xa hoi anh',
    uses: 17,
    title: 'Ảnh khoe chỉ số kênh học viên sau 30 ngày',
    preview: [
      'Ảnh chụp màn hình chỉ số, dán nhãn ',
      { mark: 'tên học viên' },
      ' và ',
      { mark: 'kết quả đạt được' },
      '. Chỉ đăng số liệu đã xin phép người học.',
    ],
    pillar: 'Bằng chứng xã hội',
  },
  {
    id: 'boc-term-tro-ly-ao-cho-tiem-nho',
    format: 'text',
    keywords: 'tro ly ao tiem nho giao duc thi truong boc term',
    uses: 12,
    title: 'Bóc term: trợ lý ảo làm được gì cho tiệm nhỏ',
    preview: [
      'Giải thích một thuật ngữ bằng ví dụ ngay trong ',
      { mark: 'ngành của khách' },
      '. Ba việc cụ thể trợ lý ảo làm thay. Kết bằng câu hỏi mở.',
    ],
    pillar: 'Giáo dục thị trường',
  },
  {
    id: 'hau-truong-mot-ngay-ra-12-clip',
    format: 'script',
    keywords: 'hau truong mot ngay 12 clip kich ban',
    uses: 9,
    title: 'Hậu trường: một ngày ra 12 clip của team nội dung',
    preview: [
      'Ba cảnh, mỗi cảnh 6 giây, quay dọc. Chèn chữ trên màn hình: ',
      { mark: 'mốc giờ' },
      ' — ',
      { mark: 'việc đang làm' },
      '. Không voice, chỉ nhạc nền.',
    ],
    pillar: 'Hậu trường · 20–25s',
  },
  {
    id: 'so-sanh-chinh-tay-va-preset',
    format: 'mix',
    keywords: 'so sanh chinh tay preset chung minh san pham',
    uses: 23,
    title: 'So sánh: chỉnh tay từng clip và dùng preset có sẵn',
    preview: [
      'Ảnh chia đôi. Caption dạng bảng ba dòng — thời gian, số thao tác, kết quả — điền từ ',
      { mark: 'mô tả sản phẩm' },
      '.',
    ],
    pillar: 'Chứng minh sản phẩm',
  },
  {
    id: 'cau-hoi-mo-khau-nao-ngon-thoi-gian',
    format: 'text',
    keywords: 'cau hoi mo tuong tac binh luan khau nao ngon thoi gian',
    uses: 31,
    title: 'Câu hỏi mở: khâu nào ngốn thời gian nhất của bạn?',
    preview: [
      'Một câu hỏi kèm ba đáp án đánh số để khách trả lời bằng bình luận. Gắn thẳng ',
      { mark: 'nỗi đau chính' },
      ' trong chân dung khách hàng.',
    ],
    pillar: 'Tương tác',
  },
];
