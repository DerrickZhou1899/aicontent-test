/**
 * CONG CUA TIEN TRINH NEN — KHONG DUNG O TIEN TRINH WEB.
 *
 * Worker can doc cheo khong gian lam viec that: vong lap lay viec phai nhin het
 * bang `jobs` roi moi biet viec do thuoc workspace nao. Do la ly do duy nhat
 * cong nay ton tai.
 *
 * Ba rao chan quanh no:
 *   1. KHONG duoc re-export tu `lib/data-access/index.ts`.
 *   2. `tests/data-access-guard.test.cjs` chan moi file ngoai `workers/**` va
 *      `lib/queue/**` cham vao ten `createSystemRepo` — ke ca toan bo `app/`.
 *   3. Phase 13 gan vai tro PostgreSQL rieng (`DATABASE_URL_WORKER`) va bat phan
 *      quyen theo hang cho vai tro cua web; ke ca khi hai rao tren bi qua mat
 *      thi tien trinh web van khong co quyen doc cheo.
 *
 * `dbToanHeThong` la loi thoat hiem CO CHU Y, khong phai so sot. Moi truy van
 * cheo workspace phai viet ro rang o `workers/**` hoac `lib/queue/**` de con
 * doc lai duoc khi soat bao mat.
 */

import { taoKetNoi } from '@/db/client';

import { taoRepo } from './index';

type KetNoiWorker = ReturnType<typeof taoKetNoi>;

let ketNoiWorker: KetNoiWorker | null = null;

/**
 * Mo ket noi tre chu khong mo luc nap module: tien trinh web co the vo tinh nap
 * file nay (vi du qua mot cay import), va no khong duoc phep mo them ket noi
 * bang vai tro worker chi vi bi nap.
 */
function layKetNoiWorker(): KetNoiWorker {
  if (ketNoiWorker === null) {
    const chuoi = process.env.DATABASE_URL_WORKER;
    if (!chuoi) {
      throw new Error('Thieu bien moi truong DATABASE_URL_WORKER');
    }
    ketNoiWorker = taoKetNoi(chuoi);
  }
  return ketNoiWorker;
}

export function createSystemRepo() {
  const { db, pool } = layKetNoiWorker();

  return {
    /** Ban Drizzle KHONG gioi han pham vi — chi dung cho truy van cheo workspace. */
    dbToanHeThong: db,
    pool,

    /**
     * Ngay khi worker biet viec thuoc workspace nao thi quay ve repo co pham vi.
     * Moi thao tac nghiep vu cua worker phai di duong nay, khong dung
     * `dbToanHeThong`.
     */
    repoTheoWorkspace(workspaceId: string) {
      return taoRepo(db, workspaceId);
    },
  };
}
