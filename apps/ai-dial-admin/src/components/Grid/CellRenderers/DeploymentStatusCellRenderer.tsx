'use client';

import { ICellRendererParams } from 'ag-grid-community';

import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

const DeploymentStatusCellRenderer = ({ value }: ICellRendererParams) => {
  if (!value) return null;
  return <StatusIndicator status={value as IMAGE_STATUS | CONTAINER_STATUS} />;
};

export default DeploymentStatusCellRenderer;
