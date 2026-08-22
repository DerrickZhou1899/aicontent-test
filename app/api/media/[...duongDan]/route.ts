/**
 * Tuyen doc anh trong kho tren dia.
 *
 * KHO NAM NGOAI THU MUC MA NGUON nen khong co duong tinh nao toi no — phai co
 * mot tuyen doc. Va vi da co mot tuyen doc, no phai tu kiem quyen:
 *
 *  1. Chua dang nhap thi khong doc duoc gi (middleware da chan, day la lop hai).
 *  2. Duong dan bat dau bang `workspaceId` cua chinh nguoi dang doc. Doan ma
 *     bam cua mot anh cua khach khac cung khong mo duoc.
 *  3. Duong `../` bi chan o `duongDanAnToan` — neu khong thi mot yeu cau kheo
 *     leo doc duoc `/etc/passwd` hay chinh tep `.env`.
 */

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { duongDanAnToan } from '@/lib/keo-bai/kho-anh';

const KIEU_THEO_DUOI: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(
  _yeuCau: Request,
  ngucanh: { params: Promise<{ duongDan: string[] }> },
) {
  const workspaceId = await workspaceHienTai();
  const { duongDan } = await ngucanh.params;
  const tuongDoi = duongDan.join('/');

  // Tien to phai la workspace cua chinh nguoi dang doc.
  if (duongDan[0] !== workspaceId) {
    return new Response('Không tìm thấy', { status: 404 });
  }

  const dayDu = duongDanAnToan(tuongDoi);
  if (!dayDu) return new Response('Không tìm thấy', { status: 404 });

  const kieu = KIEU_THEO_DUOI[path.extname(dayDu).toLowerCase()];
  if (!kieu) return new Response('Không tìm thấy', { status: 404 });

  try {
    await stat(dayDu);
    const du = await readFile(dayDu);
    return new Response(new Uint8Array(du), {
      headers: {
        'Content-Type': kieu,
        // Ten tep la ma bam cua lien ket goc nen noi dung khong bao gio doi.
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Không tìm thấy', { status: 404 });
  }
}
