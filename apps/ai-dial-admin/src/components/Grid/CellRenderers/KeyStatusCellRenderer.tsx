'use client';

import { ICellRendererParams } from 'ag-grid-community';

import KeyViewStatus from '@/src/components/Keys/View/Header/KeyStatus';

const KeyStatusCellRenderer = (params: ICellRendererParams) => {
  return <KeyViewStatus data={params.data} />;
};

export default KeyStatusCellRenderer;
