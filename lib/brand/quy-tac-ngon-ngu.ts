/**
 * Quy tac ngon ngu cua thuong hieu — content bible muc 9.2 va 9.3.
 *
 * Vi sao la ma chay chu khong phai mot doan trong loi nhac: loi nhac la loi
 * KHUYEN, mo hinh nghe hay khong thi khong ai biet. Bang nay chay duoc tren
 * moi bai truoc khi luu, nen mot cau hua sai su that bi bat ngay thay vi lot
 * ra kenh roi moi phat hien.
 *
 * Day la lop canh bao, KHONG phai lop chan: mot so cum tu co the xuat hien hop
 * le khi dang trich dan lai loi khach. Nguoi dung quyet dinh cuoi cung.
 *
 * Phase 11 (cham chat luong) dung lai bo nay cho tieu chi "Tinh xac thuc".
 */

export type ViPhamNgonNgu = {
  /** Cum tu tim thay trong bai. */
  cumTu: string;
  /** Viet lai thanh gi — lay tu bang muc 9.3 cua content bible. */
  thayBang: string;
  /** Vi tri ky tu dau tien, de giao dien to sang dung cho. */
  viTri: number;
  /** Cau chua cum tu, cat gon de hien trong canh bao. */
  boiCanh: string;
};

/**
 * Bang chu co dau -> chu ASCII tuong ung, ANH XA MOT DOI MOT.
 *
 * Mot doi mot la yeu cau bat buoc chu khong phai tinh co: nho do chuoi da gap
 * dau co DO DAI Y HET chuoi goc, nen vi tri tim thay tren chuoi gap van tro
 * dung ky tu tren chuoi goc. Dung `normalize('NFD')` roi xoa dau thanh se lam
 * lech do dai va moi vi tri bao ve giao dien deu sai cho.
 */
const BO_DAU: Record<string, string> = {};
for (const [khong, co] of [
  ['a', 'àáạảãâầấậẩẫăằắặẳẵ'],
  ['e', 'èéẹẻẽêềếệểễ'],
  ['i', 'ìíịỉĩ'],
  ['o', 'òóọỏõôồốộổỗơờớợởỡ'],
  ['u', 'ùúụủũưừứựửữ'],
  ['y', 'ỳýỵỷỹ'],
  ['d', 'đ'],
]) {
  for (const ky of co) {
    BO_DAU[ky] = khong;
    BO_DAU[ky.toUpperCase()] = khong;
  }
}

/** Gap dau va ha chu thuong, giu nguyen do dai chuoi. */
function gapDau(vanBan: string): string {
  let ra = '';
  for (const ky of vanBan) ra += BO_DAU[ky] ?? ky.toLowerCase();
  return ra;
}

/**
 * Bang muc 9.3: cum tu bi cam kem ban thay the bat buoc.
 *
 * `mau` viet bang ASCII THUONG vi no chay tren chuoi da gap dau — nhan duoc ca
 * "tự động 100%" lan "tu dong 100%". Nhan su go khong dau la chuyen thuong,
 * bat mot kieu viet la bo sot mot nua truong hop.
 */
const BANG_THAY_THE: { mau: RegExp; cumTu: string; thayBang: string }[] = [
  {
    mau: /tu\s*dong\s*100\s*%/g,
    cumTu: 'tự động 100%',
    thayBang: 'AI hỗ trợ dựng, bạn duyệt bản cuối',
  },
  {
    mau: /ai\s*cung\s*(?:ra|lam)\s*(?:duoc\s*)?video\s*trong\s*\d+\s*phut/g,
    cumTu: 'ai cũng ra video trong X phút',
    thayBang: 'thời gian phụ thuộc video và cấu hình; đây là kết quả demo thực tế',
  },
  {
    mau: /khong\s*can\s*lam\s*gi/g,
    cumTu: 'không cần làm gì',
    thayBang: 'giảm các thao tác dựng lặp lại',
  },
  {
    mau: /thay\s*the\s*editor/g,
    cumTu: 'thay thế editor',
    thayBang: 'giúp cá nhân/team xử lý nhanh hơn các video thường nhật',
  },
  {
    mau: /(?:video\s*)?chuyen\s*nghiep\s*ngay\s*lap\s*tuc/g,
    cumTu: 'video chuyên nghiệp ngay lập tức',
    thayBang: 'video nhất quán và sẵn sàng đăng theo quy trình đã thiết lập',
  },
  // Muc 9.2 — tu ngu bi cam, khong co ban thay the co dinh.
  {
    mau: /\bdot\s*pha\b/g,
    cumTu: 'đột phá',
    thayBang: 'nói thẳng cải thiện cụ thể là gì',
  },
  {
    mau: /\bcach\s*mang\b/g,
    cumTu: 'cách mạng',
    thayBang: 'nói thẳng cải thiện cụ thể là gì',
  },
];

/** Cat mot doan boi canh quanh vi tri tim thay, de canh bao doc duoc. */
function catBoiCanh(vanBan: string, viTri: number, doDai: number): string {
  const dau = Math.max(0, viTri - 40);
  const cuoi = Math.min(vanBan.length, viTri + doDai + 40);
  const doan = vanBan.slice(dau, cuoi).replace(/\s+/g, ' ').trim();
  return `${dau > 0 ? '…' : ''}${doan}${cuoi < vanBan.length ? '…' : ''}`;
}

/**
 * Quet mot bai, tra ve moi vi pham quy tac ngon ngu.
 *
 * Tra mang rong nghia la bai sach theo bang nay — KHONG co nghia la bai dung
 * su that. Kiem tinh xac thuc that su la viec cua Phase 11.
 */
export function quetQuyTacNgonNgu(vanBan: string): ViPhamNgonNgu[] {
  if (!vanBan) return [];

  // Quet tren ban da gap dau, nhung cat boi canh tu van ban GOC de nguoi dung
  // doc lai dung cau ho da viet.
  const daGap = gapDau(vanBan);

  const viPham: ViPhamNgonNgu[] = [];
  for (const { mau, cumTu, thayBang } of BANG_THAY_THE) {
    // `lastIndex` cua regex co co `g` la trang thai dung chung — dat lai truoc
    // moi lan quet, neu khong lan quet thu hai se bo sot tu dau van ban.
    mau.lastIndex = 0;
    for (const khop of daGap.matchAll(mau)) {
      if (khop.index === undefined) continue;
      viPham.push({
        cumTu,
        thayBang,
        viTri: khop.index,
        boiCanh: catBoiCanh(vanBan, khop.index, khop[0].length),
      });
    }
  }

  return viPham.sort((a, b) => a.viTri - b.viTri);
}

/** Danh sach cum tu bi cam — cho giao dien hien bang huong dan. */
export const CUM_TU_BI_CAM = BANG_THAY_THE.map(({ cumTu, thayBang }) => ({
  cumTu,
  thayBang,
}));
