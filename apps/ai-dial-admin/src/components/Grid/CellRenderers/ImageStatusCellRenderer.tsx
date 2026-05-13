'use client';

import { ICellRendererParams } from 'ag-grid-community';

import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

const ImageStatusCellRenderer = ({ value }: ICellRendererParams) => {
  if (!value) return null;
  return <StatusIndicator status={value as IMAGE_STATUS} />;
};

export default ImageStatusCellRenderer;
