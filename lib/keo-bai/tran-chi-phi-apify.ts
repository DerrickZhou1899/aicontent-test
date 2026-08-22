/**
 * Cong chan chi phi Apify: hoi so du THAT truoc khi tieu tien.
 *
 * `GET /v2/users/me/limits` tra ve ca tran thang lan muc da dung (kiem that
 * 13/08/2026). Doc thang nguon nay thay vi tu cong don `cost_log`: tu cong don
 * chi thay phan tien CHINH APP NAY tieu, ma tai khoan Apify con duoc dung boi
 * viec khac ngoai repo — cong don se luon thap hon thuc te va cong mo oan.
 *
 * HAI KIEU "KHONG CHAY", dung nham la hong mot trong hai huong:
 *
 *   - DOC DUOC han muc va biet chac da vuot nguong  -> chan CA HAI luong.
 *   - KHONG DOC DUOC han muc (mang hong, Apify 5xx) -> chan luong `theo-doi`,
 *     nhung CHO luong `loi` chay.
 *
 * Vi sao phan biet: luong `loi` (keo bai cua chinh minh) da chay production TU
 * TRUOC khi co cong nay, va truoc do no khong phu thuoc `/limits` chut nao. Neu
 * mot truc trac tam thoi cua endpoint `/limits` lam chet luon tinh nang do thi
 * cong chan chi phi da gay ra dung thu ma no khong duoc phep gay ra: lam hong
 * mot tinh nang dang chay. Con `theo-doi` la tinh nang moi — no chua tung chay
 * khi khong biet so du, nen mac dinh dong voi no khong lam mat gi.
 */

const URL_LIMITS = 'https://api.apify.com/v2/users/me/limits';
const HET_GIO_MS = 10_000;

/**
 * Hai nguong, khong phai mot.
 *
 * Luong keo bai CUA MINH la tinh nang loi dang chay production; theo doi kenh
 * ngoai la cai moi. Dung chung mot nguong thi cai moi tieu het han muc se lam
 * te liet cai loi — mot tinh nang phu khong duoc quyen giet tinh nang chinh.
 */
export type LoaiLuot = 'theo-doi' | 'loi';

function nguongPhanTram(loai: LoaiLuot): number {
  const tho = loai === 'loi' ? process.env.APIFY_NGUONG_LOI : process.env.APIFY_NGUONG_THEO_DOI;
  const so = Number(tho);
  if (!Number.isFinite(so) || so <= 0 || so > 100) return loai === 'loi' ? 97 : 80;
  return so;
}

export type ConChoKeo =
  | { chay: true; conLaiUsd: number | null; daDungUsd: number | null; tranUsd: number | null }
  | { chay: false; lyDo: string; conLaiUsd: number | null };

/**
 * Khong doc duoc han muc thi lam gi.
 *
 * Luong loi chay tiep (khoi phuc hanh vi truoc khi co cong nay); luong theo doi
 * dung lai. Ghi ly do vao ca hai duong de nhat ky con thay.
 */
function khongDocDuoc(loai: LoaiLuot, lyDo: string): ConChoKeo {
  if (loai === 'loi') {
    return { chay: true, conLaiUsd: null, daDungUsd: null, tranUsd: null };
  }
  return { chay: false, lyDo, conLaiUsd: null };
}

type TraVeLimits = {
  data?: {
    limits?: { maxMonthlyUsageUsd?: number };
    current?: { monthlyUsageUsd?: number };
  };
};

/**
 * `uocTinhUsd` la chi phi du kien cua luot sap chay (so bai x don gia + phi khoi
 * dong). Cong tru truoc chu khong chi so voi muc hien tai: mot luot lon co the
 * nhay qua nguong ngay trong luc chay.
 */
export async function conChoDeKeo(
  uocTinhUsd: number,
  loai: LoaiLuot = 'theo-doi',
  docLimits: typeof fetch = fetch,
): Promise<ConChoKeo> {
  const token = process.env.APIFY_TOKEN;
  // Thieu token thi CHAN CA HAI: khong phai truc trac tam thoi, va luot chay se
  // hong ngay sau do — chan som cho thong bao ro rang hon.
  if (!token) {
    return { chay: false, lyDo: 'Thieu APIFY_TOKEN', conLaiUsd: null };
  }

  let tho: TraVeLimits;
  try {
    const phanHoi = await docLimits(URL_LIMITS, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(HET_GIO_MS),
    });
    if (!phanHoi.ok) {
      return khongDocDuoc(loai, `Apify /limits tra ma ${phanHoi.status}`);
    }
    tho = (await phanHoi.json()) as TraVeLimits;
  } catch (loi) {
    return khongDocDuoc(
      loai,
      `Khong doc duoc han muc Apify: ${loi instanceof Error ? loi.message : String(loi)}`,
    );
  }

  const tranUsd = tho.data?.limits?.maxMonthlyUsageUsd;
  const daDungUsd = tho.data?.current?.monthlyUsageUsd;
  if (typeof tranUsd !== 'number' || typeof daDungUsd !== 'number') {
    return khongDocDuoc(loai, 'Apify /limits thieu truong han muc');
  }

  const nguong = (tranUsd * nguongPhanTram(loai)) / 100;
  const conLaiUsd = Math.max(0, tranUsd - daDungUsd);

  if (daDungUsd + uocTinhUsd > nguong) {
    return {
      chay: false,
      lyDo:
        `Cham nguong ${nguongPhanTram(loai)}% (${nguong.toFixed(2)} USD): da dung ` +
        `${daDungUsd.toFixed(2)} + uoc tinh ${uocTinhUsd.toFixed(2)} USD`,
      conLaiUsd,
    };
  }

  return { chay: true, conLaiUsd, daDungUsd, tranUsd };
}
