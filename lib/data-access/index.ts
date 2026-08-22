/**
 * TANG TRUY CAP DU LIEU — cong duy nhat giua ung dung web va PostgreSQL.
 *
 * VI SAO TANG NAY TON TAI (doc truoc khi nghi den chuyen di duong tat):
 * bo Supabase la bo phan quyen theo hang lam san. Neu moi truy van tu nho them
 * dieu kien loc thi MOT lan quen la du lieu cua khach nay hien ra cho khach
 * khac — va khong ai phat hien cho toi luc khach nhin thay. Day la la chan so 1
 * chong ro du lieu cheo khong gian lam viec.
 *
 * VI SAO LA HAM NHA MAY chu khong phai tham so roi: tham so roi thi goi 30 cho
 * la 30 co hoi quen. Nha may thi cam duoc repo nghia la da co `workspaceId`,
 * khong ton tai duong nao cam repo ma thieu no.
 *
 * LO HONG MA THIET KE NAY KHONG BIT: `createRepo()` tin gia tri nguoi goi
 * truyen vao. `createRepo(body.workspaceId)` van qua duoc ca ba lop bao ve.
 * Vi vay trong `app/` chi duoc truyen ket qua cua `workspaceHienTai()`
 * (Phase 6, doc tu phien dang nhap) — dieu nay do `tests/data-access-guard.test.cjs`
 * cuong che, khong phai quy uoc.
 *
 * CHU SO HUU FILE: Phase 5, sau do chi controller sua. Phase khac them file repo
 * moi trong thu muc nay thi khong dung nhau; sua file nay thi phai bao controller.
 */

import { db } from '@/db/client';

import { assetsRepo } from './assets';
import { baiKeoThoRepo } from './bai-keo-tho';
import { brandProfilesRepo } from './brand-profiles';
import { contentPillarsRepo } from './content-pillars';
import { contentsRepo } from './contents';
import { costLogRepo } from './cost-log';
import {
  kiemUserId,
  kiemWorkspaceId,
  type KetNoiDrizzle,
  type NguoiDungTuPhien,
  type WorkspaceScoped,
} from './guard';
import { ideasRepo } from './ideas';
import { insightsRepo } from './insights';
import { jobsRepo } from './jobs';
import { kenhDangRepo } from './kenh-dang';
import { kenhTheoDoiRepo, theoDoiCuaToiRepo } from './kenh-theo-doi';
import { tinHieuXuHuongRepo } from './tin-hieu-xu-huong';
import { modelRunsRepo } from './model-runs';
import { personasRepo } from './personas';
import { productsRepo } from './products';
import { workspaceMembersRepo } from './workspace-members';
import { workspacesRepo } from './workspaces';

/**
 * Ghep bo repo tren MOT ket noi bat ky. Tach ra de `createSystemRepo()` dung
 * lai duoc voi ket noi cua vai tro tien trinh nen — khong phai de noi nao khac
 * tu chon ket noi.
 */
export function taoRepo(ketNoi: KetNoiDrizzle, workspaceId: string) {
  const ws = kiemWorkspaceId(workspaceId);

  return {
    workspaceId: ws,
    workspaces: workspacesRepo(ketNoi, ws),
    workspaceMembers: workspaceMembersRepo(ketNoi, ws),
    jobs: jobsRepo(ketNoi, ws),
    modelRuns: modelRunsRepo(ketNoi, ws),
    costLog: costLogRepo(ketNoi, ws),
    contents: contentsRepo(ketNoi, ws),
    // Nam nhom ho so thuong hieu (Phase 8).
    hoSo: brandProfilesRepo(ketNoi, ws),
    sanPham: productsRepo(ketNoi, ws),
    chanDung: personasRepo(ketNoi, ws),
    insight: insightsRepo(ketNoi, ws),
    truCot: contentPillarsRepo(ketNoi, ws),
    // Y tuong may de xuat sinh ra (Phase 9).
    yTuong: ideasRepo(ketNoi, ws),
    // Keo bai tu nen tang ngoai ve.
    kenh: kenhDangRepo(ketNoi, ws),
    baiKeoTho: baiKeoThoRepo(ketNoi, ws),
    asset: assetsRepo(ketNoi, ws),
    // Theo doi kenh cua nguoi khac de hoc chu de va cach ke.
    kenhTheoDoi: kenhTheoDoiRepo(ketNoi, ws),
    theoDoiCuaToi: theoDoiCuaToiRepo(ketNoi, ws),
    tinHieuXuHuong: tinHieuXuHuongRepo(ketNoi, ws),
  };
}

/**
 * Cach DUY NHAT tien trinh web cham vao database.
 *
 * Khong co ban nap chong nao cho phep bo `workspaceId` — gia tri rong, `null`
 * hay `undefined` deu nem loi ngay tai day, truoc khi kip sinh mot cau SQL
 * khong dieu kien loc.
 */
export function createRepo(workspaceId: string) {
  return taoRepo(db, workspaceId);
}

export type Repo = ReturnType<typeof createRepo>;

/**
 * Chay nhieu thao tac ghi trong MOT giao dich.
 *
 * Can khi mot viec nghiep vu gom nhieu lenh ghi ma nua chung khong co nghia:
 * luu ban nhap boc tach ghi ho so + n san pham + n chan dung + n tru cot; hong o
 * lenh thu ba ma hai lenh dau da vao thi nguoi dung thu lai se sinh ban trung,
 * va khong co cach nao biet phan nao da vao.
 *
 * Day cung la CHO DUY NHAT mo giao dich trong tien trinh web — Phase 13 dat
 * `SET LOCAL app.current_workspace_id` o day khi bat phan quyen theo hang. Dat o
 * muc ket noi thay vi muc giao dich la du lieu workspace nay ro sang request cua
 * workspace khac, vi be ket noi dung lai ket noi giua cac request.
 */
export async function trongGiaoDich<T>(
  workspaceId: string,
  viec: (repo: ReturnType<typeof taoRepo>) => Promise<T>,
): Promise<T> {
  const ws = kiemWorkspaceId(workspaceId);
  return db.transaction((tx) => viec(taoRepo(tx as unknown as KetNoiDrizzle, ws)));
}

export { kiemUserId, kiemWorkspaceId };
export type { KetNoiDrizzle, NguoiDungTuPhien, WorkspaceScoped };

// CO Y KHONG re-export `createSystemRepo` o day. No dung vai tro database bo qua
// pham vi workspace; de lot vao `index.ts` la mo san cua cho tien trinh web goi
// nham. Muon dung thi import thang `./system-repo`, va chi `workers/**` +
// `lib/queue/**` duoc phep — test quet ma chan phan con lai.
