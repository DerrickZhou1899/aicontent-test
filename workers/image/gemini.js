'use strict';

const GIOI_HAN_ANH_BYTE  = 8 * 1024 * 1024;
const HET_GIO_GOI_MS     = 240_000;
const MO_HINH_MAC_DINH   = 'gemini-3.1-flash-image';
const MIME_HOP_LE        = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Gọi REST trực tiếp để worker nhận byte ảnh, không ép kết quả qua bộ dọn JSON
 * của worker văn bản và không đưa khóa API vào tiến trình web.
 */
async function goiGeminiSinhAnh(thamSo) {
  const {
    apiKey    = process.env.GEMINI_API_KEY,
    moHinh    = process.env.GEMINI_IMAGE_MODEL || MO_HINH_MAC_DINH,
    loiNhac,
    tiLe,
    hetGioMs  = HET_GIO_GOI_MS,
    fetchImpl = globalThis.fetch,
  } = thamSo;

  if (!apiKey) throw new Error('Thiếu GEMINI_API_KEY cho worker sinh ảnh');
  if (typeof loiNhac !== 'string' || loiNhac.trim() === '') {
    throw new Error('Lời nhắc sinh ảnh không hợp lệ');
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(moHinh)}:generateContent`;
  const phanHoi = await fetchImpl(url, {
    method  : 'POST',
    headers : {
      'Content-Type'   : 'application/json',
      'x-goog-api-key' : apiKey,
    },
    signal  : AbortSignal.timeout(hetGioMs),
    body    : JSON.stringify({
      contents         : [{ parts: [{ text: loiNhac.trim() }] }],
      generationConfig : {
        responseModalities : ['IMAGE'],
        imageConfig        : { aspectRatio: tiLe },
      },
    }),
  });

  if (!phanHoi.ok) throw new Error(`Gemini sinh ảnh thất bại (${phanHoi.status ?? 'không rõ'})`);
  const duLieu = await phanHoi.json();
  const cacPhan = duLieu?.candidates?.[0]?.content?.parts ?? [];
  const phanAnh = [...cacPhan].reverse().find((phan) => (
    phan?.thought !== true
    && MIME_HOP_LE.has(phan?.inlineData?.mimeType)
    && typeof phan?.inlineData?.data === 'string'
  ));
  if (!phanAnh) throw new Error('Gemini không trả về ảnh hợp lệ');

  const anh = Buffer.from(phanAnh.inlineData.data, 'base64');
  if (anh.length === 0 || anh.length > GIOI_HAN_ANH_BYTE) {
    throw new Error('Kích thước ảnh Gemini không hợp lệ');
  }
  return { mimeType: phanAnh.inlineData.mimeType, duLieu: anh };
}

module.exports = { GIOI_HAN_ANH_BYTE, MO_HINH_MAC_DINH, goiGeminiSinhAnh };
