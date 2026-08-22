'use strict';

/**
 * Bo quet ma nguon cua tang truy cap du lieu (Phase 5).
 *
 * Day la phan quan trong nhat cua Phase 5. Khong co no thi tang truy cap chi la
 * quy uoc, ma quy uoc thi tuan thu ba se co nguoi quen.
 *
 * ================== CAC DANG DA CHAN DUOC ==================
 *   import x from '@/db/client'            (va moi duong dan tuong doi tuong duong)
 *   import { db } from '<bat ky dau>'      (ke ca `db as X`, `import db from`,
 *                                           `import * as db from`)
 *   const { db } = require('...')          (va require/import() dong)
 *   drizzle(...)                           ngoai `db/client.ts` va `db/client-worker.js`
 *   new Pool(...) / new Client(...)        ngoai `db/client.ts` va `db/client-worker.js`
 *   createSystemRepo / import system-repo  ngoai `workers/**` va `lib/queue/**`
 *   taoRepo(...)                           ngoai `lib/data-access/**`
 *   createRepo(<doi so tuy y>)             trong `app/**`
 *   kiemUserId(...)                        ngoai `lib/auth/nguoi-dung-tu-phien.ts`
 *                                          va `lib/data-access/**`
 *
 * ================== CAC DANG CHUA CHAN DUOC — biet truoc, khong noi qua ======
 *   - Truy cap dong: `require(bien)`, `import(bien)`, `globalThis.db`,
 *     `eval`. Chuoi ghep tay thi regex khong doc ra duoc.
 *   - Doi ten khi re-export: mot file trong `lib/data-access/` co the
 *     `export { db }` roi noi khac import ten khac — bat duoc ten `db` chu khong
 *     bat duoc ten da doi.
 *   - Thu vien ngoai tu mo ket noi pg cua rieng no.
 *   - Ma trong `tests/` khong bi quet (test can viet ra chinh cac chuoi nay).
 *   - Bo chu thich bang regex: mot chuoi ky tu chua `/*` co the lam lech ket qua
 *     theo huong BO SOT.
 *   Phase 13 them phan quyen theo hang cua PostgreSQL lam luoi thu hai cho dung
 *   cac lo nay.
 */

const fs = require('node:fs');
const path = require('node:path');

const GOC = path.resolve(__dirname, '..');

/** Thu muc co ma nguon chay that. `tests/` co y khong nam trong danh sach. */
const THU_MUC_QUET = ['app', 'lib', 'workers', 'config', 'scripts', 'docker', 'db'];

const DUOI_MA = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const THU_MUC_BO = new Set(['node_modules', '.next', '.git', 'plans', 'docs', 'file_update']);

/** Chinh tang truy cap — noi duy nhat duoc phep cham vao `db`. */
const TANG_TRUY_CAP = 'lib/data-access/';

/** Cho duy nhat duoc bien `userId` cua phien thanh `NguoiDungTuPhien`. */
const CAU_NOI_NGUOI_DUNG = 'lib/auth/nguoi-dung-tu-phien.ts';

/**
 * Cac tep giu ket noi: CHI chung duoc goi `drizzle()` va `new Pool()`.
 * Hai tep vi co hai moi truong chay:
 *   - `db/client.ts`        tien trinh web (Next.js, doc duoc TypeScript)
 *   - `db/client-worker.js` worker chay `node` tran duoi pm2 — Node 20 khong doc
 *                           duoc `.ts` nen worker khong the dung tep tren.
 * Bat bien giu nguyen va de kiem: ket noi chi mo trong `db/`, khong o dau khac.
 */
const TEP_KET_NOI = new Set(['db/client.ts', 'db/client-worker.js']);

/**
 * Ngoai le cua luat cam import `db` — liet ke dung ten tep, khong noi long regex.
 *
 * `auth.ts`: Auth.js bat buoc `DrizzleAdapter(db)`. Bon bang cua no (users,
 * oauth_accounts, sessions, verification_tokens) KHONG co cot `workspace_id`
 * nen khong co gi de ro cheo.
 *
 * `app/api/dev-login/route.ts`: cua dang nhap danh rieng cho bai test, cham vao
 * dung bon bang do va tu tat khi NODE_ENV=production. Cung ly do, cung pham vi.
 */
const NGOAI_LE_IMPORT_DB = new Set(['auth.ts', 'app/api/dev-login/route.ts']);

/** Chi tien trinh nen duoc cham vao cong bo qua pham vi workspace. */
const DUOC_DUNG_SYSTEM_REPO = ['workers/', 'lib/queue/'];

/**
 * Luat doi so cua `createRepo()` chi ap cho `app/`. `lib/auth/`, `lib/queue/` va
 * `workers/` duoc truyen gia tri tu do — chung khong nam trong luong request cua
 * nguoi dung nen khong co "tham so ke tan cong gui len" de chan.
 */

// ---------------------------------------------------------------------------
// Duyet cay thu muc
// ---------------------------------------------------------------------------

function gomTepTrongThuMuc(thuMucTuyetDoi, ketQua) {
  for (const muc of fs.readdirSync(thuMucTuyetDoi, { withFileTypes: true })) {
    if (muc.isDirectory()) {
      if (THU_MUC_BO.has(muc.name)) continue;
      gomTepTrongThuMuc(path.join(thuMucTuyetDoi, muc.name), ketQua);
      continue;
    }
    if (!muc.isFile()) continue;
    if (!DUOI_MA.has(path.extname(muc.name))) continue;
    ketQua.push(path.relative(GOC, path.join(thuMucTuyetDoi, muc.name)));
  }
  return ketQua;
}

/** Danh sach file ma nguon can quet, duong dan tuong doi so voi goc repo. */
function lietKeTepMa() {
  const ketQua = [];

  for (const muc of fs.readdirSync(GOC, { withFileTypes: true })) {
    if (muc.isFile() && DUOI_MA.has(path.extname(muc.name))) ketQua.push(muc.name);
  }

  for (const thuMuc of THU_MUC_QUET) {
    const duongDan = path.join(GOC, thuMuc);
    if (fs.existsSync(duongDan)) gomTepTrongThuMuc(duongDan, ketQua);
  }

  return ketQua.map((p) => p.split(path.sep).join('/')).sort();
}

// ---------------------------------------------------------------------------
// Tien xu ly
// ---------------------------------------------------------------------------

/** Thay chu thich bang khoang trang de giu nguyen so dong va vi tri ky tu. */
function boChuThich(noiDung) {
  const khongKhoi = noiDung.replace(/\/\*[\s\S]*?\*\//g, (khop) =>
    khop.replace(/[^\n]/g, ' '),
  );
  // `[^:\w]` de khong nuot `http://` trong chuoi ky tu.
  return khongKhoi.replace(/(^|[^:\w])\/\/[^\n]*/gm, (khop, dau) =>
    dau + ' '.repeat(khop.length - dau.length),
  );
}

function tinhDong(noiDung, viTri) {
  let dong = 1;
  for (let i = 0; i < viTri && i < noiDung.length; i += 1) {
    if (noiDung[i] === '\n') dong += 1;
  }
  return dong;
}

/** `@/x` -> `x`; `./x` -> theo thu muc file; module ngoai -> `null`. */
function chuanHoaDuongDan(duongDanTep, chiDinh) {
  let thoDuongDan;
  if (chiDinh.startsWith('@/')) {
    thoDuongDan = chiDinh.slice(2);
  } else if (chiDinh.startsWith('./') || chiDinh.startsWith('../')) {
    thoDuongDan = path.posix.normalize(
      path.posix.join(path.posix.dirname(duongDanTep), chiDinh),
    );
  } else {
    return null;
  }
  return thoDuongDan.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '');
}

/** Cat doi so dau tien cua mot loi goi, dem ngoac de khong dut giua chung. */
function catDoiSo(noiDung, viTriMoNgoac) {
  let sau = 0;
  for (let i = viTriMoNgoac; i < noiDung.length; i += 1) {
    if (noiDung[i] === '(') sau += 1;
    else if (noiDung[i] === ')') {
      sau -= 1;
      if (sau === 0) return noiDung.slice(viTriMoNgoac + 1, i).trim();
    }
  }
  return null;
}

function batDauBang(duongDan, danhSach) {
  return danhSach.some((tienTo) => duongDan.startsWith(tienTo));
}

// ---------------------------------------------------------------------------
// Cac luat
// ---------------------------------------------------------------------------

const RE_CHI_DINH =
  /(?:^|[^\w$.])(?:from|import|require)\s*\(?\s*(['"])([^'"]+)\1/g;
const RE_MENH_DE_IMPORT = /import\s+([\s\S]*?)\s+from\s*['"][^'"]+['"]/g;
const RE_HUY_CAU_TRUC_REQUIRE =
  /(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\s*\(\s*['"][^'"]+['"]\s*\)/g;

function tenTrongMenhDe(menhDe) {
  const ten = [];
  const trongNgoac = menhDe.match(/\{([\s\S]*)\}/);
  if (trongNgoac) {
    for (const phan of trongNgoac[1].split(',')) {
      const goc = phan.trim().split(/\s+as\s+/)[0].trim().replace(/^type\s+/, '');
      if (goc) ten.push(goc);
    }
  }
  const macDinh = menhDe.match(/^\s*(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,|$)/);
  if (macDinh) ten.push(macDinh[1]);
  const khongGian = menhDe.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (khongGian) ten.push(khongGian[1]);
  return ten;
}

/**
 * Quet mot file. Tach rieng khoi phan doc dia de test tu kiem duoc bang noi dung
 * gia — mot bo quet khong bao gio bao loi la mot bo quet vo dung.
 */
function quetNoiDung(duongDan, noiDungGoc) {
  const viPham = [];
  const noiDung = boChuThich(noiDungGoc);
  const trongTangTruyCap = duongDan.startsWith(TANG_TRUY_CAP);
  const laTepKetNoi = TEP_KET_NOI.has(duongDan);
  const duocImportDb = NGOAI_LE_IMPORT_DB.has(duongDan) || trongTangTruyCap;

  const ghi = (quyTac, viTri, chiTiet) => {
    viPham.push({ quyTac, duongDan, dong: tinhDong(noiDung, viTri), chiTiet });
  };

  // A. Import be ket noi.
  if (!duocImportDb) {
    RE_CHI_DINH.lastIndex = 0;
    let khop;
    while ((khop = RE_CHI_DINH.exec(noiDung)) !== null) {
      if (chuanHoaDuongDan(duongDan, khop[2]) === 'db/client') {
        ghi('import-db-client', khop.index, `import '${khop[2]}'`);
      }
    }
  }

  // B. Import ten `db` tu bat ky dau.
  if (!duocImportDb) {
    RE_MENH_DE_IMPORT.lastIndex = 0;
    let khop;
    while ((khop = RE_MENH_DE_IMPORT.exec(noiDung)) !== null) {
      if (tenTrongMenhDe(khop[1]).includes('db')) {
        ghi('import-ten-db', khop.index, khop[0].replace(/\s+/g, ' ').slice(0, 80));
      }
    }
    RE_HUY_CAU_TRUC_REQUIRE.lastIndex = 0;
    while ((khop = RE_HUY_CAU_TRUC_REQUIRE.exec(noiDung)) !== null) {
      const ten = khop[1].split(',').map((p) => p.trim().split(':')[0].trim());
      if (ten.includes('db')) {
        ghi('import-ten-db', khop.index, khop[0].replace(/\s+/g, ' ').slice(0, 80));
      }
    }
  }

  // C. Tu mo ket noi Drizzle.
  if (!laTepKetNoi) {
    for (const khop of noiDung.matchAll(/\bdrizzle\s*\(/g)) {
      ghi('goi-drizzle', khop.index, 'drizzle(');
    }
  }

  // D. Tu mo ket noi pg. Bat ca `new Pool` chu khong chi bat chuoi `db`.
  if (!laTepKetNoi) {
    for (const khop of noiDung.matchAll(/\bnew\s+(Pool|Client)\s*\(/g)) {
      ghi('tu-mo-ket-noi-pg', khop.index, `new ${khop[1]}(`);
    }
  }

  // E. Cong bo qua pham vi workspace.
  if (!trongTangTruyCap && !batDauBang(duongDan, DUOC_DUNG_SYSTEM_REPO)) {
    for (const khop of noiDung.matchAll(/\bcreateSystemRepo\b/g)) {
      ghi('system-repo-sai-cho', khop.index, 'createSystemRepo');
    }
    RE_CHI_DINH.lastIndex = 0;
    let khop;
    while ((khop = RE_CHI_DINH.exec(noiDung)) !== null) {
      const daChuanHoa = chuanHoaDuongDan(duongDan, khop[2]);
      if (daChuanHoa === `${TANG_TRUY_CAP}system-repo`) {
        ghi('system-repo-sai-cho', khop.index, `import '${khop[2]}'`);
      }
    }
  }

  // F. `taoRepo()` nhan ket noi tu do — chi tang truy cap duoc goi.
  if (!trongTangTruyCap) {
    for (const khop of noiDung.matchAll(/\btaoRepo\s*\(/g)) {
      ghi('taoRepo-sai-cho', khop.index, 'taoRepo(');
    }
  }

  // G. Trong `app/`, `createRepo()` chi duoc nhan ket qua cua `workspaceHienTai()`.
  if (duongDan.startsWith('app/')) {
    for (const khop of noiDung.matchAll(/\bcreateRepo\s*\(/g)) {
      const doiSo = catDoiSo(noiDung, khop.index + khop[0].length - 1);
      if (doiSo === null || !doiSoHopLe(noiDung, doiSo)) {
        ghi('createRepo-doi-so-tu-do', khop.index, `createRepo(${doiSo ?? '?'})`);
      }
    }
  }

  // H. TRUC CO LAP THU HAI (nguoi dung trong cung workspace).
  //
  // Danh sach kenh theo doi la rieng tung nguoi. Kieu `NguoiDungTuPhien` co nhan
  // nen khong the truyen mot chuoi vao dung cho no, va doi thu tu tham so la loi
  // bien dich — nhung kieu khong chan duoc viec ai do TU CHE ra mot gia tri tu
  // `body.userId`. `kiemUserId()` la cua duy nhat lam ra gia tri do, nen no chi
  // duoc goi o cau noi doc phien. Khoa cua lai thi nguon goc chi con mot.
  if (!trongTangTruyCap && duongDan !== CAU_NOI_NGUOI_DUNG) {
    for (const khop of noiDung.matchAll(/\bkiemUserId\s*\(/g)) {
      ghi('kiem-user-id-sai-cho', khop.index, 'kiemUserId(');
    }
  }

  return viPham;
}

/**
 * Chap nhan `createRepo(await workspaceHienTai())` va dang dat qua bien trung
 * gian trong cung file. Moi dang khac deu bi chan: `createRepo(body.workspaceId)`
 * qua duoc ca ba lop bao ve ma nguoi dung van doc duoc du lieu cua khach khac.
 */
function doiSoHopLe(noiDung, doiSo) {
  if (/^(?:await\s+)?workspaceHienTai\s*\(\s*\)$/.test(doiSo)) return true;
  if (!/^[A-Za-z_$][\w$]*$/.test(doiSo)) return false;
  const gan = new RegExp(
    `\\b${doiSo}\\s*=\\s*(?:await\\s+)?workspaceHienTai\\s*\\(`,
  );
  return gan.test(noiDung);
}

function quetToanBo() {
  const viPham = [];
  for (const duongDan of lietKeTepMa()) {
    const noiDung = fs.readFileSync(path.join(GOC, duongDan), 'utf8');
    viPham.push(...quetNoiDung(duongDan, noiDung));
  }
  return viPham;
}

function moTaViPham(viPham) {
  return viPham
    .map((v) => `  [${v.quyTac}] ${v.duongDan}:${v.dong} -> ${v.chiTiet}`)
    .join('\n');
}

module.exports = {
  GOC,
  lietKeTepMa,
  quetNoiDung,
  quetToanBo,
  moTaViPham,
};
