'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialTooltip, EllipsisTooltip } from '@epam/ai-dial-ui-kit';
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
    <div className="flex min-w-0 flex-col justify-center">
      <div className="flex min-w-0 items-center gap-2">
        {/*
         * The label and the info icon are sibling tooltip triggers, so the pointer on the icon shows
         * only its explanation and anywhere else on the cell shows only the name.
         */}
        <DialTooltip triggerClassName="flex min-w-0 grow" tooltip={data.displayLabel}>
          <button
            type="button"
            className="flex min-w-0 flex-1 text-left text-primary hover:text-accent-primary focus-visible:text-accent-primary"
            onClick={() => onOpenRow(data)}
          >
            <span className="truncate">{data.displayLabel}</span>
          </button>
        </DialTooltip>
        {data.isFallbackLabel && data.fallbackTooltip && (
          <DialTooltip tooltip={data.fallbackTooltip}>
            <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="shrink-0 text-secondary" aria-hidden />
          </DialTooltip>
        )}
      </div>
      {data.subLabel && (
        <span className="dial-tiny-text flex min-w-0 text-secondary">
          {data.subLabelTooltip ? (
            <DialTooltip tooltip={data.subLabelTooltip}>
              <span className="truncate">
                {data.subLabel}
                {/* The tooltip holds the names the count stands for, and a pointer is the only way
                    to it; a screen reader gets them here instead of the bare count. */}
                <span className="sr-only">{data.subLabelTooltip}</span>
              </span>
            </DialTooltip>
          ) : (
            <EllipsisTooltip text={data.subLabel} />
          )}
        </span>
      )}
    </div>
  );
};

export default DimensionCell;
