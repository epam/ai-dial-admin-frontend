'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import RatingCounts from '@/src/components/Analytics/ConversationsTrace/RatingCounts';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const RatingCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  if (!data || data.rating_up === null || data.rating_down === null) {
    return null;
  }

  return <RatingCounts counts={data} isPeriodScoped className="h-full" />;
};

export default RatingCellRenderer;
