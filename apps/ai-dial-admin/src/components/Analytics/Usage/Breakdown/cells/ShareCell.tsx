'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import ShareBar from '@/src/components/Common/ShareBar/ShareBar';
import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import { formatPercent } from '@/src/components/Analytics/Usage/utils/format';

const ShareCell: FC<ICellRendererParams<BreakdownRowModel>> = ({ data }) => {
  if (!data || data.share == null) {
    return <span className="text-secondary">—</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <ShareBar value={data.share} className="max-w-[240px]" />
      <span className="w-12 shrink-0 text-right text-secondary">{formatPercent(data.share, 0)}</span>
    </div>
  );
};

export default ShareCell;
