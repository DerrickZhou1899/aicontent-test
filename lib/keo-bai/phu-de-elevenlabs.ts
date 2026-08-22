/**
 * Boc phu de tu video bang ElevenLabs Scribe (speech-to-text).
 *
 * KHONG TAI VIDEO VE. Endpoint nhan `source_url` va tu tai, tu tach tieng o phia
 * ElevenLabs — VPS khong dong den tep video, khong chay ffmpeg. Day la rang buoc
 * chu du an dat ra, va no giai quyet duoc bang API chu khong phai bang cach cat
 * bot tinh nang.
 *
 * DIEU PHAI NHO: lien ket video cua Facebook co chu ky va HET HAN. Goi ham nay
 * NGAY SAU luot keo. De sang hom sau la ElevenLabs tai ve 403 va phu de rong ma
 * khong ai biet vi sao.
 */

const DIA_CHI = 'https://api.elevenlabs.io/v1/speech-to-text';

/** Scribe v1 — ban co timestamp theo tu, dung duoc de dung phu de. */
const MO_HINH = 'scribe_v1';

/** Tieng Viet. Khai bao san giup Scribe khong doan nham sang tieng khac. */
const MA_NGON_NGU = 'vie';

export type KetQuaPhuDe =
  | { ok: true; vanBan: string; ngonNgu: string | null }
  | { ok: false; loi: string };

export async function bocPhuDe(urlVideo: string): Promise<KetQuaPhuDe> {
  const khoa = process.env.ELEVENLABS_API_KEY;
  if (!khoa) return { ok: false, loi: 'Chưa cấu hình ELEVENLABS_API_KEY trên máy chủ.' };

  const bieuMau = new FormData();
  bieuMau.set('model_id', MO_HINH);
  bieuMau.set('source_url', urlVideo);
  bieuMau.set('language_code', MA_NGON_NGU);

  let phanHoi: Response;
  try {
    phanHoi = await fetch(DIA_CHI, {
      method: 'POST',
      headers: { 'xi-api-key': khoa },
      body: bieuMau,
      // Boc mot video vai phut mat khoang mot phut. Cho rong rai hon vi ben do
      // con phai tu tai video ve truoc khi boc.
      signal: AbortSignal.timeout(300_000),
    });
  } catch (loi) {
    return { ok: false, loi: `Không gọi được ElevenLabs: ${(loi as Error).message}` };
  }

  if (!phanHoi.ok) {
    const than = await phanHoi.text().catch(() => '');
    // Than phan hoi cua ElevenLabs khong chua khoa nen kem vao duoc — va no la
    // thu duy nhat phan biet "het so du" voi "lien ket video da het han".
    return {
      ok: false,
      loi: `ElevenLabs trả về lỗi ${phanHoi.status}: ${than.slice(0, 200)}`,
    };
  }

  const ket = (await phanHoi.json()) as { text?: unknown; language_code?: unknown };
  const vanBan = typeof ket.text === 'string' ? ket.text.trim() : '';
  if (!vanBan) {
    // ElevenLabs tra 200 kem van ban rong ca khi video khong co tieng LAN khi ho
    // khong tai duoc lien ket. Do that 13/08/2026: video tu thang 9/2024 roi vao
    // truong hop nay va tra ve trong mot giay — nhanh hon han mot luot boc that.
    // Khong doan bua ly do; noi ca hai kha nang kem viec nguoi dung lam duoc.
    return {
      ok: false,
      loi: 'Không bóc được tiếng. Video có thể không có âm thanh, hoặc liên kết gốc đã hết hạn — kéo lại bài này để lấy liên kết mới.',
    };
  }

  return {
    ok: true,
    vanBan,
    ngonNgu: typeof ket.language_code === 'string' ? ket.language_code : null,
  };
}
