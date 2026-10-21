import { FC, ReactNode } from 'react';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';

interface Props {
  id: string;
  /** Independent badge elements; the row collapses when none of them renders anything. */
  statusBadges?: ReactNode;
}

const HeaderIdBlock: FC<Props> = ({ id, statusBadges }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <div className="flex items-center gap-5 py-1 empty:hidden">{statusBadges}</div>
    <ReadonlyId value={id} />
  </div>
);

export default HeaderIdBlock;
