'use client';

import { ICellRendererParams } from 'ag-grid-community';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';

import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { NO_DATA_VALUE } from '@/src/components/Runs/Summary/Cards/constants';

/** A higher pass rate is better, so a rise is green and a fall red. */
const RunTrendDeltaCell = ({ data }: ICellRendererParams<RunTrendRow>) => {
  const label = data?.deltaLabel;

  if (label == null) {
    return <span className="flex size-full items-center text-secondary">{NO_DATA_VALUE}</span>;
  }

  const isIncrease = label.startsWith('+');

  return (
    <div className="flex size-full items-center">
      <Badge
        label={label}
        variant={BadgeVariant.Filled}
        color={isIncrease ? BadgeColor.Green : BadgeColor.Red}
        textClassName="dial-tiny-semi-text"
      />
    </div>
  );
};

export default RunTrendDeltaCell;
