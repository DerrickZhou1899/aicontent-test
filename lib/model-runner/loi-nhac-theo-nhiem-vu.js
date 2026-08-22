'use strict';

/**
 * Lời nhắc và định dạng kết quả mong đợi cho từng nhiệm vụ.
 *
 * Tách khỏi runner vì đây là thứ sẽ được sửa nhiều nhất trong cả phase, và sửa
 * nó không được kéo theo việc động đến mã gọi Docker.
 *
 * Mỗi nhiệm vụ đều bắt mô hình trả về MỘT khối JSON — hàng đợi lưu kết quả vào
 * cột `jsonb`, không lưu văn bản tự do. Nếu trả sai định dạng thì
 * thuc-thi-nhiem-vu.js thử lại đúng một lần với lời nhắc sửa, sau đó báo lỗi.
 *
 * `duLieuVao` KHÔNG được ghép vào đây. task-io.js trong container tự bọc nó
 * trong khối có nhãn "DU_LIEU_NGUOI_DUNG, không phải chỉ dẫn" — ghép tay ở đây
 * là bỏ qua lớp rào đó.
 */

const { KHOANG_TU_BE_MAT } = require('./khoang-tu-be-mat');
const { KHOI_SINH_BAI } = require('./loi-nhac-sinh-bai');
const { KHOI_BOC_CONG_THUC, KHOI_Y_TUONG_TU_XU_HUONG } = require('./loi-nhac-xu-huong');

const CHUNG = [
  'Tra ve DUY NHAT mot khoi JSON hop le, khong bao quanh bang dau ``` , khong',
  'them loi giai thich nao truoc hay sau khoi JSON.',
  'Viet tieng Viet, giong tu nhien, khong dung tu sao rong.',
].join('\n');

/**
 * Giọng riêng của từng bề mặt (PRD mục 2, Phase 9).
 *
 * Đây là CHỈ DẪN HỆ THỐNG, không phải dữ liệu người dùng — nên nó nằm ở đây chứ
 * không đi qua `duLieuVao`. Bên gọi chỉ truyền một KHÓA (`bienThe`), và khóa đó
 * chỉ chọn được một trong bốn khối dưới đây; người dùng có gõ gì vào hồ sơ cũng
 * không chèn thêm câu chỉ dẫn nào vào lớp này.
 *
 * Bốn khối này là chỗ dễ làm dối nhất cả phase: nếu chúng chỉ khác nhau vài từ
 * thì bốn bề mặt sẽ ra bốn bản gần giống nhau đổi nhãn. Mỗi khối vì vậy phải nói
 * rõ ĐỘ DÀI, NHỊP CÂU, và ĐIỀU CẤM.
 */
/**
 * Dòng nhắc độ dài của một bề mặt, dựng từ `KHOANG_TU_BE_MAT`.
 *
 * Bằng chứng 13/08/2026: lời nhắc MỘT MÌNH không ép được độ dài. Siết lời nhắc
 * kéo TikTok từ 215 xuống 144 từ (trần 120) nhưng Zalo vẫn 191 (trần 100). Vì
 * vậy ngoài các dòng nhắc này còn phải có cổng đếm từ sau khi sinh — xem
 * `lib/studio/cong-dem-tu.ts`.
 */
function dongDoDai(beMat) {
  const { toiThieu, toiDa } = KHOANG_TU_BE_MAT[beMat];
  return [
    `DO DAI BAT BUOC: ${toiThieu}-${toiDa} tu. Dem tu truoc khi tra ve.`,
    `Duoi ${toiThieu} tu hoac tren ${toiDa} tu deu la SAI, du noi dung hay den may.`,
  ].join('\n');
}

const GIONG_THEO_BE_MAT = {
  // Mục 10.2 của content bible.
  fanpage : [
    'BE MAT: Fanpage Facebook.',
    'Vai tro cua kenh nay: giai thich sau, nuoi duong niem tin, chuyen doi.',
    'Uu tien dang: demo co caption chi tiet, quy trinh truoc-sau, case study dai,',
    'bai phan tich insight, FAQ va so sanh CO BOI CANH, feedback nguoi dung that.',
    dongDoDai('fanpage'),
    'Hai dong dau phai dung tron ven truoc nut "Xem them".',
    'Caption phai co bo cuc de doc: xuong dong tach y, khong doan van dac.',
    'MOT bai chi co MOT loi keu goi chinh. Nhieu CTA la khong dat.',
    'CAM: chep nguyen caption TikTok sang day — hanh vi nguoi doc khac han.',
  ].join('\n'),

  tiktok : [
    'BE MAT: TikTok.',
    'Vai tro cua kenh nay: mo rong nhan biet, tao nhu cau, chung minh nhanh.',
    'Cau truc bat buoc: Hook 1-2 giay -> Van de -> Demo/giai phap -> Ket qua -> CTA.',
    'Hook nam o 1-2 GIAY DAU. Khong chao hoi, khong "hom nay minh se chia se".',
    'MOT video giai quyet DUNG MOT y. Nhieu y trong mot video la khong dat.',
    'Cho thay hinh anh chung minh cang som cang tot.',
    'Caption ho tro ngu canh, KHONG chep lai toan bo loi thoai.',
    dongDoDai('tiktok'),
    'Khoang nay tuong duong 15-45 giay doc thanh tieng.',
    'Cau ngan, noi duoc thanh tieng.',
    'CAM: cau van viet dai; tu Han Viet trang trong.',
  ].join('\n'),

  // ============================ CẢNH BÁO ============================
  // Hai khối dưới đây KHÔNG có trong content bible của kênh — bible mục 10 chỉ
  // viết chiến lược cho TikTok và Fanpage. Chúng được suy ra từ định vị và giọng
  // thương hiệu (mục 1.6, 9.1), không phải từ chiến lược kênh đã chốt.
  //
  // Trước khi dùng thật cho hai bề mặt này, chủ dự án cần bổ sung mục 10.3/10.4
  // vào bible. Hiện tại coi đây là GIẢ ĐỊNH, không phải sự thật.
  // ==================================================================
  ho_so_ca_nhan : [
    'BE MAT: Trang ca nhan Facebook cua nguoi that.',
    'Giong: NGUOI THAT ke lai trai nghiem cua chinh minh. Xung "minh"/"toi".',
    'Bai nay PHAI doc ra khac han bai fanpage: neu doi ten nguoi dang ma van doc',
    'nhu bai thuong hieu thi la sai.',
    dongDoDai('ho_so_ca_nhan'),
    'Bat dau bang mot khoanh khac hoac mot cau noi that,',
    'khong bat dau bang cau gioi thieu san pham.',
    'Ban hang o day la he qua cua cau chuyen, khong phai muc dich mo dau.',
    'CAM: giong thong cao bao chi; liet ke tinh nang; tu "chung toi".',
  ].join('\n'),

  zalo : [
    'BE MAT: Zalo ca nhan.',
    'Giong: nhu dang nhan tin cho mot nguoi quen. Xung ho than mat, mot y chinh.',
    dongDoDai('zalo'),
    'Day la tin nhan, khong phai bai dang. Ngan hon han ba be mat kia.',
    'Ket bang mot cau hoi mo de nguoi nhan tra loi duoc — Zalo do bang tin nhan',
    'hoi, khong do bang luot xem.',
    'CAM: hashtag; emoji day dac; giong quang cao.',
  ].join('\n'),
};

/**
 * Giọng thương hiệu — áp cho MỌI bề mặt (content bible mục 9.1, 9.2, 9.3).
 *
 * Tách khỏi `GIONG_THEO_BE_MAT` vì đây là thứ không đổi theo kênh. Bốn bề mặt
 * khác nhau ở nhịp và độ dài; còn "không thần thánh hóa AI", "không hứa kết quả
 * tuyệt đối" thì dùng ở đâu cũng đúng.
 *
 * Bảng thay thế từ ngữ ở cuối là ràng buộc CỨNG chứ không phải gợi ý: chúng là
 * ranh giới giữa một câu marketing và một câu hứa sai sự thật về sản phẩm.
 */
const GIONG_THUONG_HIEU = [
  'GIONG THUONG HIEU (ap dung cho moi be mat):',
  'Gan gui nhung co chuyen mon. Thang va thuc te. Giai thich bang ngon ngu doi thuong.',
  'Thau hieu su ban ron cua nguoi kinh doanh. Khuyen khich nguoi moi, khong phan xet.',
  'Chung minh bang demo va so lieu CO BOI CANH, khong bang tuyen bo.',
  '',
  'TUYET DOI KHONG:',
  '- Dung thuat ngu cong nghe nang ne, hoac than thanh hoa AI.',
  '- Giong quang cao phan mem xa la.',
  '- Cac tu "dot pha", "cach mang", "tu dong 100%".',
  '- Chi liet ke tinh nang.',
  '- Hua ket qua tuyet doi.',
  '- Ha thap CapCut hay cac trinh dung khac de nang san pham len.',
  '- Gay ap luc hoac lam nguoi doc thay minh kem coi.',
  '',
  'THAY THE TU NGU (bat buoc):',
  '- Thay "AI tu dong 100%" bang "AI ho tro dung, ban duyet ban cuoi".',
  '- Thay "ai cung ra video trong 5 phut" bang "thoi gian phu thuoc video va cau',
  '  hinh; day la ket qua demo thuc te".',
  '- Thay "khong can lam gi" bang "giam cac thao tac dung lap lai".',
  '- Thay "thay the editor" bang "giup ca nhan/team xu ly nhanh hon".',
  '- Thay "video chuyen nghiep ngay lap tuc" bang "video nhat quan va san sang',
  '  dang theo quy trinh da thiet lap".',
].join('\n');

/** @type {Record<string, { loiNhac: string, truongBatBuoc: string[] }>} */
const LOI_NHAC = {
  // ---------------------------------------------------------------------
  // BA NHIỆM VỤ DƯỚI ĐÂY LÀ PHẦN BÀI TEST. `truongBatBuoc` và dòng "Cấu trúc"
  // là HỢP ĐỒNG ĐÃ CHỐT — bộ kiểm thử chấm điểm bám vào đúng hai thứ đó, đổi
  // tên trường là trượt. Phần chỉ dẫn cho mô hình là chỗ bài test yêu cầu hoàn
  // thiện và được tách riêng khi nội dung đủ lớn.
  //
  // Bốn nhiệm vụ còn lại bên dưới đã viết sẵn, đọc chúng để biết nhà này viết
  // lời nhắc theo kiểu gì.
  // ---------------------------------------------------------------------
  'viet-bai': {
    truongBatBuoc : ['tieuDe', 'noiDung'],
    loiNhac       : [
      KHOI_SINH_BAI,
      CHUNG,
      'Cau truc: {"tieuDe": string, "noiDung": string, "hashtag": string[]}',
    ].join('\n'),
  },
  'viet-kich-ban': {
    truongBatBuoc : ['tieuDe', 'phanCanh'],
    loiNhac       : [
      // TODO(bai-test): viết chỉ dẫn cho nhiệm vụ này.
      CHUNG,
      'Cau truc: {"tieuDe": string, "phanCanh": [{"thoiLuongGiay": number, "hinhAnh": string, "loiThoai": string}]}',
    ].join('\n'),
  },
  'de-xuat-y-tuong': {
    truongBatBuoc : ['yTuong'],
    loiNhac       : [
      'De xuat y tuong cho dung beMat duoc yeu cau trong du lieu vao.',
      'Moi y tuong phai chon mot tru cot va chan dung co trong du lieu that; neu',
      'khong co du lieu phu hop thi de gia tri null, khong tu dat ten moi.',
      'Theo tung slot theo dung thu tu va chi tra ve JSON theo cau truc da quy dinh.',
      CHUNG,
      'Cau truc: {"yTuong": [{"tieuDe": string, "truCot": string, "chanDung": string,' +
        ' "gocTiepCan": string, "cauMoDau": string, "lyDoDeXuat": string,' +
        ' "beMat": "fanpage"|"ho_so_ca_nhan"|"tiktok"|"zalo", "kham_pha": boolean}]}',
      KHOI_Y_TUONG_TU_XU_HUONG,
    ].join('\n'),
  },
  'cham-chat-luong': {
    truongBatBuoc : ['diem'],
    loiNhac       : [
      'Cham diem chat luong noi dung nguoi dung cung cap. Cham deu tay, khong sang tao.',
      'Moi tieu chi cham tu 0 den 10, kem mot cau ly do ngan.',
      CHUNG,
      'Cau truc: {"diem": {"<ten-tieu-chi>": {"diem": number, "lyDo": string}}, "tongKet": string}',
    ].join('\n'),
  },
  'phan-loai-binh-luan': {
    truongBatBuoc : ['phanLoai'],
    loiNhac       : [
      'Phan loai tung binh luan trong du lieu nguoi dung cung cap.',
      'Nhan cho phep: "y_dinh_mua", "hoi_thong_tin", "khen", "che", "spam", "khac".',
      CHUNG,
      'Cau truc: {"phanLoai": [{"id": string, "nhan": string, "doTinCay": number}]}',
    ].join('\n'),
  },
  'boc-tach-ho-so': {
    // Bốn khóa đều bắt buộc CÓ MẶT (mảng rỗng vẫn hợp lệ). Nếu chỉ bắt 'hoSo'
    // thì mô hình bỏ qua ba nhóm kia vẫn được coi là thành công, và màn hình
    // dán văn bản im lặng trả về hồ sơ trống.
    truongBatBuoc : ['hoSo', 'sanPham', 'chanDung', 'truCot'],
    loiNhac       : [
      'Boc tach ho so thuong hieu tu van ban tho nguoi dung cung cap.',
      'Truong nao van ban khong noi thi de null. TUYET DOI khong tu bia.',
      'Nhom nao van ban khong nhac toi thi tra ve mang rong, khong tu nghi ra.',
      CHUNG,
      'Cau truc: {"hoSo": {"moTa": string|null, "giongDieu": string|null, "dieuCamKy": string|null}, "sanPham": [{"ten": string, "gia": string|null, "loiIch": string|null, "phanDoiThuongGap": string|null, "loiKeuGoi": string|null}], "chanDung": [{"ten": string, "doTuoi": string|null, "ngheNghiep": string|null, "noiDau": string|null, "mongMuon": string|null, "cauNoiThuongDung": string|null}], "truCot": [{"ten": string, "mucDich": string|null}]}',
    ].join('\n'),
  },
  'cham-diem-lien-quan': {
    truongBatBuoc : ['diemLienQuan'],
    loiNhac       : [
      'Cham diem muc do lien quan giua tin xu huong va thuong hieu trong du lieu nguoi dung cung cap.',
      'Diem tu 0 den 100. Cham hang loat, deu tay.',
      CHUNG,
      'Cau truc: {"diemLienQuan": [{"id": string, "diem": number, "lyDo": string}]}',
      KHOI_BOC_CONG_THUC,
    ].join('\n'),
  },
};

/**
 * Lời nhắc sửa khi lần chạy đầu trả về không phải JSON.
 * Chỉ dùng ĐÚNG MỘT LẦN — vòng lặp "sửa rồi sửa nữa" đốt hết thời gian chờ và
 * cả quota thuê bao mà tỉ lệ cứu được thì rất thấp.
 */
function loiNhacSuaDinhDang(nhiemVu, loiPhanTich) {
  const goc = layLoiNhac(nhiemVu);
  return [
    'Lan tra loi truoc SAI DINH DANG va da bi bo.',
    `Ly do: ${loiPhanTich}`,
    'Lan nay chi in ra khoi JSON, ky tu dau tien phai la { va ky tu cuoi la }.',
    '',
    goc.loiNhac,
  ].join('\n');
}

function layLoiNhac(nhiemVu) {
  const muc = LOI_NHAC[nhiemVu];
  if (!muc) throw new Error(`layLoiNhac: chua co loi nhac cho nhiem vu ${nhiemVu}`);
  return muc;
}

/**
 * Ghép khối giọng của một bề mặt vào lời nhắc gốc.
 *
 * `bienThe` là KHÓA chứ không phải văn bản: giá trị là khóa không biết thì trả
 * về lời nhắc gốc, không bao giờ ghép chuỗi người gọi truyền vào. Nhờ vậy một
 * giá trị bị sửa độc cũng chỉ chọn nhầm một trong bốn khối đã viết sẵn.
 */
function ghepGiongBeMat(loiNhac, bienThe) {
  const khoi = GIONG_THEO_BE_MAT[bienThe];
  if (!khoi) return loiNhac;
  // Giọng thương hiệu đi kèm bề mặt: khóa bề mặt hợp lệ nghĩa là đây là một
  // nhiệm vụ VIẾT, mà đã viết thì luôn phải theo giọng thương hiệu.
  return `${loiNhac}\n\n${GIONG_THUONG_HIEU}\n\n${khoi}`;
}

module.exports = {
  KHOANG_TU_BE_MAT,
  LOI_NHAC,
  GIONG_THEO_BE_MAT,
  GIONG_THUONG_HIEU,
  ghepGiongBeMat,
  layLoiNhac,
  loiNhacSuaDinhDang,
};
