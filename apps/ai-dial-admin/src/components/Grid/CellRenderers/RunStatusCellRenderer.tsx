'use client';

import { ICellRendererParams } from 'ag-grid-community';

import RunStatusComponent from '@/src/components/Common/RunStatus/RunStatus';

export interface RunStatusCellRendererParams extends ICellRendererParams {
  /** Set on a column narrowed to the indicator alone; the label stays in the tooltip and the a11y tree. */
  isLabelHidden?: boolean;
}

const RunStatusCellRenderer = ({ value, isLabelHidden }: RunStatusCellRendererParams) => {
  return (
    <div className="flex items-center justify-center">
      <RunStatusComponent status={value} isLabelHidden={isLabelHidden} />
    </div>
  );
};

export default RunStatusCellRenderer;
