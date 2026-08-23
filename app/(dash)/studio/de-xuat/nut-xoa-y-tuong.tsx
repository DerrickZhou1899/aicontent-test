'use client';

import { useFormStatus } from 'react-dom';

import { xoaYTuong } from './actions';

function NutGui() {
  const { pending } = useFormStatus();

  return (
    <button className="y-tuong-da-luu__xoa" type="submit" disabled={pending}>
      {pending ? 'Đang xóa…' : 'Xóa'}
    </button>
  );
}

type ThuocTinh = {
  ideaId  : string;
  tieuDe  : string;
  daDung  : boolean;
};

export function NutXoaYTuong({ ideaId, tieuDe, daDung }: ThuocTinh) {
  if (daDung) return <span className="y-tuong-da-luu__da-dung">Đã dùng</span>;

  return (
    <form
      className="y-tuong-da-luu__hanh-dong"
      action={xoaYTuong}
      onSubmit={(suKien) => {
        if (!window.confirm(`Xóa ý tưởng “${tieuDe}”?`)) suKien.preventDefault();
      }}
    >
      <input type="hidden" name="ideaId" value={ideaId} />
      <NutGui />
    </form>
  );
}
