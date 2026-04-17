'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import ExternalLink from '@/src/components/Deployments/Common/ExternalLink/ExternalLink';

const ExternalUrlCellRenderer: FC<ICellRendererParams> = ({ value }) => (
  <ExternalLink value={value ? String(value) : undefined} />
);

export default ExternalUrlCellRenderer;
