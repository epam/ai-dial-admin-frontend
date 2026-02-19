'use client';

import { ICellRendererParams } from 'ag-grid-community';

import ValidityStatus from '@/src/components/Common/ValidityStatus/ValidityStatus';

const ValidityStatusCellRenderer = (params: ICellRendererParams) => {
  return <ValidityStatus {...params.data.validityState} isHideHint={true} />;
};

export default ValidityStatusCellRenderer;
