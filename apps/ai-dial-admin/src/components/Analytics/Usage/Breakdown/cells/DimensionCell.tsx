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
         * The truncation and its tooltip belong to one element. With the button clipping the text
         * as well, two elements each believed they were the one cut: the pointer got two tooltips
         * at once, both repeating the same name, and a third from the icon beside them.
         */}
        <button
          type="button"
          className="flex min-w-0 flex-1 text-left text-primary hover:text-accent-primary focus-visible:text-accent-primary"
          onClick={() => onOpenRow(data)}
        >
          <EllipsisTooltip text={data.displayLabel} />
        </button>
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
