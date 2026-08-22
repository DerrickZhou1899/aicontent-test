import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../sprite-icon';
import { docToanBoHoSo } from './doc-ho-so';
import { NGUONG_CHAN_DE_XUAT, TEN_NHOM, type NhomHoSo } from '@/lib/brand/do-day-du';
import { DANH_SACH_NHOM } from '@/lib/brand/dac-ta-nhom';
import './brand.css';

export const metadata: Metadata = {
  title: 'Hồ sơ kênh — AI Content',
  description: 'Hồ sơ thương hiệu: sản phẩm, chân dung khách, insight, trụ cột, giọng điệu.',
};

/** Doc lai moi lan vao trang — do day du phai phan anh dung thu vua sua. */
export const dynamic = 'force-dynamic';

const BAN_KINH = 72;
const CHU_VI = 2 * Math.PI * BAN_KINH;

export default async function TrangHoSo() {
  const { doDayDu, sanPham, chanDung, insight, truCot } = await docToanBoHoSo();
  const dat = new Set<NhomHoSo>(doDayDu.daCo);

  const soLuong: Record<string, number> = {
    'san-pham': sanPham.length,
    'chan-dung': chanDung.length,
    insight: insight.length,
    'tru-cot': truCot.length,
  };

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-layers" size={13} />
            Hồ sơ kênh
          </span>
          <h1 className="page-title">Hồ sơ thương hiệu</h1>
          <p className="page-sub">
            Đây là đầu vào của mọi thứ sau: đề xuất ý tưởng, viết bài, chấm chất lượng. Hồ sơ
            sai thì cả hệ thống sai theo mà không có dấu hiệu nào.
          </p>
        </div>
        <Link className="btn btn--primary" href="/brand/dan-van-ban">
          <Icon name="i-sparkle" size={17} />
          Dán văn bản để bóc tách
        </Link>
      </div>

      <section className="ho-so-tong" aria-label="Độ đầy đủ hồ sơ">
        <div className="vong">
          <div className="vong__hinh">
            <svg viewBox="0 0 168 168" aria-hidden="true">
              <circle className="vong__nen" cx="84" cy="84" r={BAN_KINH} />
              <circle
                className={`vong__chay${doDayDu.duocPhepDeXuat ? '' : ' vong__chay--thieu'}`}
                cx="84"
                cy="84"
                r={BAN_KINH}
                strokeDasharray={CHU_VI}
                strokeDashoffset={CHU_VI * (1 - doDayDu.phanTram / 100)}
              />
            </svg>
            <div className="vong__so">
              <span className="vong__phan-tram">{doDayDu.phanTram}%</span>
              <span className="vong__nhan">độ đầy đủ</span>
            </div>
          </div>
          <p className="vong__trang-thai">
            {doDayDu.duocPhepDeXuat
              ? 'Đủ căn cứ để máy đề xuất chạy.'
              : `Cần từ ${NGUONG_CHAN_DE_XUAT}% thì máy đề xuất mới chạy.`}
          </p>
        </div>

        <div
          className={`chan ${doDayDu.duocPhepDeXuat ? 'chan--mo' : 'chan--chan'}`}
          role="status"
        >
          <p className="chan__tieu-de">
            <Icon name={doDayDu.duocPhepDeXuat ? 'i-check' : 'i-alert'} size={17} />
            {doDayDu.duocPhepDeXuat ? 'Máy đề xuất đã mở' : 'Máy đề xuất đang bị chặn'}
          </p>

          {doDayDu.duocPhepDeXuat ? (
            <p className="chan__sub">
              Hồ sơ đạt {doDayDu.phanTram}%. Càng đầy đủ thì đề xuất càng bám kênh — điền nốt
              các nhóm còn lại vẫn có ích.
            </p>
          ) : (
            <>
              <p className="chan__sub">
                Đề xuất trên hồ sơ thiếu chỉ ra được nội dung chung chung. Điền nốt những nhóm
                dưới đây, xếp theo mức ảnh hưởng:
              </p>
              <ul className="chan__thieu">
                {doDayDu.conThieu.map((thieu) => (
                  <li key={thieu.nhom}>
                    <span className="chan__trong-so">+{thieu.trongSo}%</span>
                    <span>
                      <strong>{thieu.ten}</strong> — cần {thieu.yeuCau}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="nhom-luoi" aria-label="Năm nhóm hồ sơ">
        {DANH_SACH_NHOM.map((nhom) => (
          <Link className="nhom-the" key={nhom.slug} href={`/brand/${nhom.slug}`}>
            <span className="nhom-the__dau">
              <Icon name={nhom.icon} size={18} />
              <span className="nhom-the__ten">{nhom.ten}</span>
            </span>
            <p className="nhom-the__mo-ta">{nhom.moTa}</p>
            <span className="nhom-the__chan">
              <span>{soLuong[nhom.slug]} mục</span>
              <DauDat dat={dat.has(nhom.repo as NhomHoSo)} />
            </span>
          </Link>
        ))}

        <Link className="nhom-the" href="/brand/giong-dieu">
          <span className="nhom-the__dau">
            <Icon name="i-text" size={18} />
            <span className="nhom-the__ten">{TEN_NHOM.giongDieu}</span>
          </span>
          <p className="nhom-the__mo-ta">
            Cách kênh nói chuyện, và những điều tuyệt đối không được viết.
          </p>
          <span className="nhom-the__chan">
            <span>1 hồ sơ</span>
            <DauDat dat={dat.has('giongDieu')} />
          </span>
        </Link>
      </section>
    </>
  );
}

function DauDat({ dat }: { dat: boolean }) {
  return (
    <span className={`dau-dat ${dat ? 'dau-dat--co' : 'dau-dat--chua'}`}>
      <Icon name={dat ? 'i-check' : 'i-alert'} size={12} />
      {dat ? 'Đã đủ' : 'Chưa đủ'}
    </span>
  );
}
