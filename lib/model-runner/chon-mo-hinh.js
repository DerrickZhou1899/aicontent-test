'use strict';

/**
 * Bang mac dinh mo hinh theo nhiem vu (PRD muc 8.3) va anh xa nhiem vu -> loai viec.
 *
 * CANH BAO ve hai nhan "manh" / "nhanh-re": ca hai duong dan hien tai deu la
 * thue bao dong ca nhan, KHONG tinh tien theo luot goi — nen "re" o day chua
 * phai la re that, no chi la ghi lai y dinh cua PRD. Con so chi phi that chi
 * xuat hien khi chuyen sang runner-api.js. Luc do phai doc lai bang nay.
 */

/** Mo hinh manh: dung cho viec sai mot lan la sai ca he thong. */
const MO_HINH_MANH = 'claude-cli';

/** Mo hinh nhanh/re: dung cho viec chay hang loat, can deu tay hon can sang tao. */
const MO_HINH_NHANH = 'codex-cli';

/**
 * Bo chay bang khoa API — duong duy nhat dung duoc o may ban.
 *
 * Hai nhan tren goi CLI trong container Docker bang the thue bao ca nhan cua
 * chu du an; ban khong co the do. Dat `AI_PROVIDER` trong `.env` la moi nhiem
 * vu tu chuyen sang duong nay.
 */
const MO_HINH_API = 'api';

const MO_HINH_HOP_LE = [MO_HINH_MANH, MO_HINH_NHANH, MO_HINH_API];

/** PRD muc 8.3. */
const MAC_DINH_THEO_NHIEM_VU = {
  'boc-tach-ho-so': MO_HINH_MANH, // sai o day la sai toan he thong
  'de-xuat-y-tuong': MO_HINH_MANH, // gia tri cot loi
  'viet-bai': MO_HINH_MANH, // cho chon, mac dinh manh
  'viet-kich-ban': MO_HINH_MANH, // cho chon
  'cham-chat-luong': MO_HINH_NHANH,
  'phan-loai-binh-luan': MO_HINH_NHANH,
  'cham-diem-lien-quan': MO_HINH_NHANH,
};

/**
 * `jobs.loai_viec` va `model_runs.nhiem_vu` la hai enum khac nhau trong luoc do
 * (Phase 3, da dong bang). Bang nay noi hai the gioi lai.
 *
 * `cham-diem-lien-quan` doi sang `quet-xu-huong` vi enum loai viec khong co muc
 * nao khac ung voi "cham diem lien quan xu huong" cua PRD 8.3.
 */
const LOAI_VIEC_THEO_NHIEM_VU = {
  'viet-bai': 'sinh-bai',
  'viet-kich-ban': 'sinh-kich-ban',
  'de-xuat-y-tuong': 'sinh-y-tuong',
  'cham-chat-luong': 'cham-chat-luong',
  'phan-loai-binh-luan': 'phan-loai-binh-luan',
  'boc-tach-ho-so': 'boc-tach-ho-so',
  'cham-diem-lien-quan': 'quet-xu-huong',
};

const NHIEM_VU_HOP_LE = Object.keys(LOAI_VIEC_THEO_NHIEM_VU);

/**
 * @param {string} nhiemVu
 * @param {'claude-cli' | 'codex-cli' | 'api' | 'auto'} [moHinh]
 * @returns {'claude-cli' | 'codex-cli' | 'api'}
 */
function chonMoHinh(nhiemVu, moHinh = 'auto') {
  if (moHinh && moHinh !== 'auto') {
    if (!MO_HINH_HOP_LE.includes(moHinh)) {
      throw new Error(`chonMoHinh: moHinh khong hop le: ${moHinh}`);
    }
    return moHinh;
  }
  // Kiem nhiem vu TRUOC khi xet AI_PROVIDER: nhiem vu sai ten van phai bao loi
  // ngay, khong duoc im lang di tiep chi vi may nay dat khoa API.
  const macDinh = MAC_DINH_THEO_NHIEM_VU[nhiemVu];
  if (!macDinh) throw new Error(`chonMoHinh: nhiem vu khong biet: ${nhiemVu}`);
  if (process.env.AI_PROVIDER) return MO_HINH_API;
  return macDinh;
}

/** @param {string} nhiemVu @returns {string} gia tri cua enum `loai_viec` */
function loaiViecCuaNhiemVu(nhiemVu) {
  const loaiViec = LOAI_VIEC_THEO_NHIEM_VU[nhiemVu];
  if (!loaiViec) throw new Error(`loaiViecCuaNhiemVu: nhiem vu khong biet: ${nhiemVu}`);
  return loaiViec;
}

module.exports = {
  LOAI_VIEC_THEO_NHIEM_VU,
  MAC_DINH_THEO_NHIEM_VU,
  MO_HINH_API,
  MO_HINH_HOP_LE,
  MO_HINH_MANH,
  MO_HINH_NHANH,
  NHIEM_VU_HOP_LE,
  chonMoHinh,
  loaiViecCuaNhiemVu,
};
