'use client';

import { ICellRendererParams } from 'ag-grid-community';

import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';

const ValidityStatusCellRenderer = (params: ICellRendererParams) => {
  return <ValidityStatus validityState={params.data.validityState} />;
};

export default ValidityStatusCellRenderer;
