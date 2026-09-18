'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props extends ICellRendererParams<BreakdownRowModel> {
  onOpenRow: (row: BreakdownRowModel) => void;
}

/**
 * The row's own name, and the control that opens its detail panel. It is a real button rather than a
 * clickable cell so the panel is reachable by keyboard.
 */
const DimensionCell: FC<Props> = ({ data, onOpenRow }) => {
  if (!data) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        className="min-w-0 truncate text-left text-primary hover:text-accent-primary focus-visible:text-accent-primary"
        onClick={() => onOpenRow(data)}
      >
        <DialEllipsisTooltip text={data.displayLabel} />
      </button>
      {data.isFallbackLabel && data.fallbackTooltip && (
        <DialTooltip tooltip={data.fallbackTooltip}>
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="shrink-0 text-secondary" aria-hidden />
        </DialTooltip>
      )}
    </div>
  );
};

export default DimensionCell;
