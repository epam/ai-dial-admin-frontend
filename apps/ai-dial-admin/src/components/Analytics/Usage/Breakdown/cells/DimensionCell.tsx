'use client';

import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { Tooltip, EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

/** The row's own name, with the explanation of a fallback label and the row's sub-label. */
const DimensionCell: FC<ICellRendererParams<BreakdownRowModel>> = ({ data }) => {
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
        <Tooltip triggerClassName="flex min-w-0 grow" tooltip={data.displayLabel}>
          <span className="truncate text-primary">{data.displayLabel}</span>
        </Tooltip>
        {data.isFallbackLabel && data.fallbackTooltip && (
          <Tooltip tooltip={data.fallbackTooltip}>
            <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="shrink-0 text-secondary" aria-hidden />
          </Tooltip>
        )}
      </div>
      {data.subLabel && (
        <span className="dial-tiny-text flex min-w-0 text-secondary">
          {data.subLabelTooltip ? (
            <Tooltip tooltip={data.subLabelTooltip}>
              <span className="truncate">
                {data.subLabel}
                {/* The tooltip holds the names the count stands for, and a pointer is the only way
                    to it; a screen reader gets them here instead of the bare count. */}
                <span className="sr-only">{data.subLabelTooltip}</span>
              </span>
            </Tooltip>
          ) : (
            <EllipsisTooltip text={data.subLabel} />
          )}
        </span>
      )}
    </div>
  );
};

export default DimensionCell;
