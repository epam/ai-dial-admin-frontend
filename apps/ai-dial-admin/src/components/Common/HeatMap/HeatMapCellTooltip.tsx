'use client';

import { ITooltipParams } from 'ag-grid-community';
import { FC } from 'react';

import classNames from 'classnames';

import { HeatMapCellTooltipContent } from '@/src/components/Common/HeatMap/models';

const HeatMapCellTooltip: FC<ITooltipParams<unknown, HeatMapCellTooltipContent>> = ({ value }) => {
  if (!value) {
    return null;
  }

  const hasValueDisplay = value.valueRow != null || value.valueText != null;

  return (
    <div className="heat-map-cell-tooltip flex flex-col items-center isolate">
      <div className="heat-map-cell-tooltip-arrow h-[7px] w-[14px] relative z-[2] -mb-px">
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div className="tooltip-arrow" />
        </div>
      </div>
      <div className="heat-map-cell-tooltip-body z-[1] flex gap-3 items-center rounded-lg bg-control-inverted px-3 py-2 shadow-xs">
        <div className="flex flex-col gap-1 items-start shrink-0">
          {value.rows.map((row) => (
            <span key={row.label} className="dial-tiny-text text-control-inverted whitespace-nowrap">
              {row.label}
            </span>
          ))}
          {hasValueDisplay && value.valueLabel != null && (
            <span className="dial-tiny-text text-control-inverted whitespace-nowrap">{value.valueLabel}</span>
          )}
        </div>
        <div className="flex flex-col gap-1 items-start shrink-0">
          {value.rows.map((row) => (
            <span key={row.label} className="dial-tiny-text text-control-inverted whitespace-nowrap">
              {row.value}
            </span>
          ))}
          {value.valueRow && (
            <div className="flex items-center gap-1">
              <span
                aria-hidden
                className={classNames('size-[15px] rounded-xs shrink-0 border', value.valueRow.className)}
              />
              <span className="dial-tiny-text text-control-inverted whitespace-nowrap">{value.valueRow.value}</span>
            </div>
          )}
          {!value.valueRow && value.valueText != null && (
            <span className="dial-tiny-text text-control-inverted whitespace-nowrap">{value.valueText}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatMapCellTooltip;
