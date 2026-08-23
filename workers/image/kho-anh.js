'use strict';

const { createHash } = require('node:crypto');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

const DUOI_THEO_MIME = {
  'image/jpeg' : '.jpg',
  'image/png'  : '.png',
  'image/webp' : '.webp',
};

function thuMucMacDinh() {
  return process.env.KHO_MEDIA || path.join(process.cwd(), '..', 'aicontent-media');
}

/** Tên băm giúp lần thử lại ghi đúng một file thay vì làm đầy ổ đĩa. */
async function luuAnh(thamSo) {
  const {
    thuMucGoc = thuMucMacDinh(),
    workspaceId,
    mimeType,
    duLieu,
  } = thamSo;
  const duoi = DUOI_THEO_MIME[mimeType];
  if (!duoi || !Buffer.isBuffer(duLieu) || duLieu.length === 0) {
    throw new Error('Dữ liệu ảnh cần lưu không hợp lệ');
  }
  if (typeof workspaceId !== 'string' || !/^[a-zA-Z0-9-]+$/.test(workspaceId)) {
    throw new Error('Workspace của ảnh không hợp lệ');
  }

  const ten = `${createHash('sha256').update(duLieu).digest('hex')}${duoi}`;
  const thuMucWorkspace = path.join(thuMucGoc, workspaceId);
  await mkdir(thuMucWorkspace, { recursive: true });
  await writeFile(path.join(thuMucWorkspace, ten), duLieu);
  return {
    duongDan      : `${workspaceId}/${ten}`,
    kichThuocByte : duLieu.length,
  };
}

module.exports = { luuAnh };
