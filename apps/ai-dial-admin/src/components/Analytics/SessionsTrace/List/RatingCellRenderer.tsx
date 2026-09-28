'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import RatingCounts from '@/src/components/Analytics/SessionsTrace/RatingCounts';
import { SessionRow } from '@/src/models/analytics/sessions-trace';

const RatingCellRenderer: FC<ICellRendererParams<SessionRow>> = ({ data }) => {
  if (!data || data.rating_up === null || data.rating_down === null) {
    return null;
  }

  return <RatingCounts counts={data} isPeriodScoped className="h-full" />;
};

export default RatingCellRenderer;
