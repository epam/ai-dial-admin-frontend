'use client';

import { IconEye } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';

const CompareEyeCellRenderer = (_params: ICellRendererParams) => (
  <div className="flex items-center justify-center py-1 text-secondary opacity-50">
    <IconEye size={18} aria-hidden />
  </div>
);

export default CompareEyeCellRenderer;
