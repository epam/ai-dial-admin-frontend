import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import TransformTypeBadge from '@/src/components/Analytics/Pipelines/Enrich/TransformTypeBadge';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { PipelineListItem } from '@/src/models/analytics/pipeline';

/** An aggregate row has no transform, which is an ordinary state rather than a failed read. */
export const TransformCellRenderer: FC<ICellRendererParams<PipelineListItem>> = ({ data }) =>
  data?.transform_type ? (
    <TransformTypeBadge type={data.transform_type} className="inline-block w-fit" />
  ) : (
    <span className="text-secondary">{UNAVAILABLE_VALUE}</span>
  );
