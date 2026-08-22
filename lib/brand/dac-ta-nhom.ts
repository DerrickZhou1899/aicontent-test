/**
 * Dac ta bon nhom danh sach cua ho so thuong hieu.
 *
 * Bon nhom nay khac nhau DUNG o danh sach truong. Gom vao mot cho de mot man
 * hinh dung chung dung duoc ca bon — bon trang gan giong nhau la bon cho de
 * lech nhau ve sau, va nguoi dung thay bon kieu bo cuc khac nhau cho cung mot
 * viec.
 *
 * `giong-dieu` KHONG o day: no la mot dong duy nhat tren `brand_profiles`, khong
 * phai danh sach, nen co man hinh rieng.
 */

export type KieuTruong = 'chu' | 'doan' | 'co';

export type Truong = {
  khoa: string;
  nhan: string;
  kieu: KieuTruong;
  batBuoc?: boolean;
  /** Cau goi y hien duoi o nhap — noi ro can gi, khong phai mo ta lai nhan. */
  goiY?: string;
};

export type SlugNhom = 'san-pham' | 'chan-dung' | 'insight' | 'tru-cot';

/** Ten thuoc tinh cua repo trong `createRepo()` — xem lib/data-access/index.ts. */
export type KhoaRepo = 'sanPham' | 'chanDung' | 'insight' | 'truCot';

export type DacTaNhom = {
  slug: SlugNhom;
  repo: KhoaRepo;
  ten: string;
  /** Dung trong cau: "Thêm <tenMot>". */
  tenMot: string;
  icon: string;
  moTa: string;
  /** Cot dung lam tieu de moi dong trong danh sach. */
  khoaTieuDe: string;
  truong: Truong[];
};

export const DAC_TA_NHOM: Record<SlugNhom, DacTaNhom> = {
  'san-pham': {
    slug: 'san-pham',
    repo: 'sanPham',
    ten: 'Sản phẩm & dịch vụ',
    tenMot: 'sản phẩm',
    icon: 'i-box',
    moTa: 'Thứ kênh đang bán. Máy đề xuất dựa vào đây để biết bài viết dẫn tới đâu.',
    khoaTieuDe: 'ten',
    truong: [
      { khoa: 'ten', nhan: 'Tên sản phẩm', kieu: 'chu', batBuoc: true },
      { khoa: 'gia', nhan: 'Giá', kieu: 'chu', goiY: 'Ghi khoảng giá cũng được' },
      {
        khoa: 'loiIch',
        nhan: 'Lợi ích',
        kieu: 'doan',
        goiY: 'Khách được gì — không phải sản phẩm có gì',
      },
      { khoa: 'phanDoiThuongGap', nhan: 'Phản đối thường gặp', kieu: 'doan' },
      {
        khoa: 'loiKeuGoi',
        nhan: 'Lời kêu gọi',
        kieu: 'chu',
        goiY: 'Muốn khách làm gì tiếp theo',
      },
      { khoa: 'lienKet', nhan: 'Liên kết', kieu: 'chu' },
    ],
  },

  'chan-dung': {
    slug: 'chan-dung',
    repo: 'chanDung',
    ten: 'Chân dung khách hàng',
    tenMot: 'chân dung',
    icon: 'i-person',
    moTa: 'Viết cho ai. Thiếu nhóm này thì mọi bài đều viết chung chung cho tất cả mọi người.',
    khoaTieuDe: 'ten',
    truong: [
      { khoa: 'ten', nhan: 'Tên gọi nhóm', kieu: 'chu', batBuoc: true },
      { khoa: 'doTuoi', nhan: 'Độ tuổi', kieu: 'chu' },
      { khoa: 'ngheNghiep', nhan: 'Nghề nghiệp', kieu: 'chu' },
      {
        khoa: 'noiDau',
        nhan: 'Nỗi đau',
        kieu: 'doan',
        goiY: 'Điều gì đang làm họ khó chịu',
      },
      { khoa: 'mongMuon', nhan: 'Mong muốn', kieu: 'doan' },
      {
        khoa: 'cauNoiThuongDung',
        nhan: 'Câu họ hay nói',
        kieu: 'doan',
        goiY: 'Chép nguyên văn — đây là nguồn giọng điệu thật',
      },
    ],
  },

  insight: {
    slug: 'insight',
    repo: 'insight',
    ten: 'Insight',
    tenMot: 'insight',
    icon: 'i-sparkle',
    moTa: 'Sự thật ngầm hiểu về khách. Không có bằng chứng thì đó là phỏng đoán, không phải insight.',
    khoaTieuDe: 'noiDung',
    truong: [
      { khoa: 'noiDung', nhan: 'Nội dung', kieu: 'doan', batBuoc: true },
      {
        khoa: 'bangChung',
        nhan: 'Bằng chứng',
        kieu: 'doan',
        goiY: 'Lấy từ đâu ra — bình luận, khảo sát, số liệu',
      },
      { khoa: 'nguon', nhan: 'Nguồn', kieu: 'chu' },
    ],
  },

  'tru-cot': {
    slug: 'tru-cot',
    repo: 'truCot',
    ten: 'Trụ cột nội dung',
    tenMot: 'trụ cột',
    icon: 'i-pillars',
    moTa: 'Các tuyến nội dung của kênh và tỉ lệ mong muốn giữa chúng.',
    khoaTieuDe: 'ten',
    truong: [
      { khoa: 'ten', nhan: 'Tên trụ cột', kieu: 'chu', batBuoc: true },
      {
        khoa: 'mucDich',
        nhan: 'Mục đích',
        kieu: 'doan',
        goiY: 'Trụ cột này để làm gì cho kênh',
      },
      {
        khoa: 'tiLeMucTieu',
        nhan: 'Tỉ lệ mục tiêu (%)',
        kieu: 'chu',
        goiY: 'Phần trăm bài mong muốn thuộc trụ cột này',
      },
      {
        khoa: 'khoaKhongTuGiam',
        nhan: 'Khoá — không tự giảm',
        kieu: 'co',
        goiY:
          'Bật cho trụ cột điểm thấp ngắn hạn nhưng cần giữ. ' +
          'Trụ cột nuôi dưỡng lòng tin luôn thua bài chào bán về điểm, ' +
          'nhưng bỏ nó thì bài chào bán cũng hết chốt được.',
      },
    ],
  },
};

export const DANH_SACH_NHOM = Object.values(DAC_TA_NHOM);

export function layDacTa(slug: string): DacTaNhom | null {
  return (DAC_TA_NHOM as Record<string, DacTaNhom>)[slug] ?? null;
}
