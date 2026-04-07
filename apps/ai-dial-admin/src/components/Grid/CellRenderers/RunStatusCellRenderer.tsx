'use client';

import { ICellRendererParams } from 'ag-grid-community';

import RunStatusComponent from '@/src/components/Common/RunStatus/RunStatus';

const RunStatusCellRenderer = (params: ICellRendererParams) => {
  return <RunStatusComponent status={params.value} />;
};

export default RunStatusCellRenderer;
