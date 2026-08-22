/**
 * Do day du cua ho so thuong hieu (PRD F2).
 *
 * KHONG dem so o da dien. Mot ho so co 20 san pham nhung khong co tru cot nao
 * thi may de xuat khong lam duoc gi — trong so o day theo muc anh huong toi
 * chat luong de xuat, khong theo cong suc nhap lieu.
 *
 * Ham THUAN: nhan du lieu da doc san, khong tu cham database. Nho vay Phase 9
 * goi duoc no ngay tren du lieu dang co trong tay, va test khong can dung bo.
 *
 * Vi sao tinh luc doc chu khong luu vao `brand_profiles.do_day_du`: gia tri luu
 * san chi dung cho toi lan dau co ai do sua mot nhom ma quen goi ham tinh lai.
 * Tinh moi lan doc thi khong co gi de lech. Cot `do_day_du` trong luoc do van con
 * (Phase 3 tao), hien khong duoc ghi — xem bao cao ban giao cua Phase 8.
 */

/** Nguong duoi nay thi chan may de xuat (PRD F2). */
export const NGUONG_CHAN_DE_XUAT = 60;

export type NhomHoSo = 'truCot' | 'chanDung' | 'sanPham' | 'giongDieu' | 'insight';

/**
 * Trong so tong 100. Con so nay la de xuat ban dau cua Phase 8, chinh lai duoc
 * sau khi nhan su dung that — sua o day la ca he thong doi theo.
 */
export const TRONG_SO: Record<NhomHoSo, number> = {
  truCot: 25,
  chanDung: 25,
  sanPham: 20,
  giongDieu: 20,
  insight: 10,
};

export const TEN_NHOM: Record<NhomHoSo, string> = {
  truCot: 'Trụ cột nội dung',
  chanDung: 'Chân dung khách hàng',
  sanPham: 'Sản phẩm & dịch vụ',
  giongDieu: 'Giọng điệu & điều cấm kỵ',
  insight: 'Insight',
};

/** Dieu kien toi thieu de mot nhom duoc tinh la "co". */
export const YEU_CAU: Record<NhomHoSo, string> = {
  truCot: 'ít nhất 3 trụ cột, mỗi trụ cột có mục đích',
  chanDung: 'ít nhất 1 chân dung có nỗi đau và mong muốn',
  sanPham: 'ít nhất 1 sản phẩm có lợi ích và lời kêu gọi',
  giongDieu: 'mô tả giọng điệu từ 100 ký tự trở lên, và ít nhất 1 điều cấm kỵ',
  insight: 'ít nhất 1 insight có bằng chứng',
};

/** Du lieu toi thieu ham nay can — co y KHONG nhan ca dong day du tu database. */
export type DauVaoDoDayDu = {
  truCot: { mucDich?: string | null }[];
  chanDung: { noiDau?: string | null; mongMuon?: string | null }[];
  sanPham: { loiIch?: string | null; loiKeuGoi?: string | null }[];
  insight: { bangChung?: string | null }[];
  hoSo: { giongDieu?: string | null; dieuCamKy?: string | null } | null;
};

export type KetQuaDoDayDu = {
  phanTram: number;
  /** Nhom da dat yeu cau toi thieu. */
  daCo: NhomHoSo[];
  /** Nhom chua dat, kem cau noi ro con thieu gi. */
  conThieu: { nhom: NhomHoSo; ten: string; yeuCau: string; trongSo: number }[];
  duocPhepDeXuat: boolean;
};

const coChu = (giaTri?: string | null) => typeof giaTri === 'string' && giaTri.trim() !== '';

/** Tung nhom dat hay chua — tach rieng de test soi duoc tung dieu kien. */
export function nhomDaDat(dauVao: DauVaoDoDayDu): Record<NhomHoSo, boolean> {
  return {
    truCot: dauVao.truCot.filter((t) => coChu(t.mucDich)).length >= 3,
    chanDung: dauVao.chanDung.some((c) => coChu(c.noiDau) && coChu(c.mongMuon)),
    sanPham: dauVao.sanPham.some((s) => coChu(s.loiIch) && coChu(s.loiKeuGoi)),
    // 100 ky tu la nguong "da mo ta that" chu khong phai go cho co. Dem sau khi
    // cat khoang trang hai dau de mot dong dau cach khong tinh la mo ta.
    giongDieu:
      (dauVao.hoSo?.giongDieu?.trim().length ?? 0) >= 100 && coChu(dauVao.hoSo?.dieuCamKy),
    insight: dauVao.insight.some((i) => coChu(i.bangChung)),
  };
}

export function tinhDoDayDu(dauVao: DauVaoDoDayDu): KetQuaDoDayDu {
  const dat = nhomDaDat(dauVao);
  const nhomList = Object.keys(TRONG_SO) as NhomHoSo[];

  const daCo = nhomList.filter((n) => dat[n]);
  const phanTram = daCo.reduce((tong, n) => tong + TRONG_SO[n], 0);

  const conThieu = nhomList
    .filter((n) => !dat[n])
    .map((nhom) => ({
      nhom,
      ten: TEN_NHOM[nhom],
      yeuCau: YEU_CAU[nhom],
      trongSo: TRONG_SO[nhom],
    }))
    // Thieu nhom nang nhat hien truoc: nguoi dung sua mot cho la len nhieu nhat.
    .sort((a, b) => b.trongSo - a.trongSo);

  return {
    phanTram,
    daCo,
    conThieu,
    duocPhepDeXuat: phanTram >= NGUONG_CHAN_DE_XUAT,
  };
}

/**
 * Cong cho Phase 9. Tra ve ly do o dang cau noi duoc cho nguoi dung, khong phai
 * ma loi — man hinh chi viec hien thang ra.
 */
export function kiemTraDeXuat(dauVao: DauVaoDoDayDu): {
  duocPhep: boolean;
  phanTram: number;
  lyDo: string | null;
  conThieu: KetQuaDoDayDu['conThieu'];
} {
  const kq = tinhDoDayDu(dauVao);
  if (kq.duocPhepDeXuat) {
    return { duocPhep: true, phanTram: kq.phanTram, lyDo: null, conThieu: [] };
  }
  const ten = kq.conThieu.map((t) => t.ten).join(', ');
  return {
    duocPhep: false,
    phanTram: kq.phanTram,
    lyDo:
      `Hồ sơ mới đạt ${kq.phanTram}%, cần từ ${NGUONG_CHAN_DE_XUAT}% để máy đề xuất ` +
      `chạy có căn cứ. Còn thiếu: ${ten}.`,
    conThieu: kq.conThieu,
  };
}
