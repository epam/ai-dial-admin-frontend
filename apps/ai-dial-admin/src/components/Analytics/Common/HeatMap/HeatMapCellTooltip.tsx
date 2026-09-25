'use client';

import { ITooltipParams } from 'ag-grid-community';
import { FC } from 'react';

import { HeatMapCellTooltipContent } from '@/src/components/Analytics/Common/HeatMap/models';

const HeatMapCellTooltip: FC<ITooltipParams<unknown, HeatMapCellTooltipContent>> = ({ value }) => {
  if (!value) {
    return null;
  }

  const hasValueDisplay = value.valueRow != null || value.valueText != null;

  return (
    <div className="flex flex-col items-center isolate">
      <div className="h-1 w-[9px] relative z-[2] -mb-px">
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div className="tooltip-arrow" />
        </div>
      </div>
      <div className="z-[1] flex gap-3 items-center rounded border border-primary bg-blackout px-2 py-1">
        <div className="flex flex-col gap-1 items-start shrink-0">
          {value.rows.map((row) => (
            <span key={row.label} className="dial-tiny-text text-secondary whitespace-nowrap">
              {row.label}
            </span>
          ))}
          {hasValueDisplay && value.valueLabel != null && (
            <span className="dial-tiny-text text-secondary whitespace-nowrap">{value.valueLabel}</span>
          )}
        </div>
        <div className="flex flex-col gap-1 items-start shrink-0">
          {value.rows.map((row) => (
            <span key={row.label} className="dial-tiny-text text-primary whitespace-nowrap">
              {row.value}
            </span>
          ))}
          {value.valueRow && (
            <div className="flex items-center gap-1">
              <span
                aria-hidden
                className="size-[15px] rounded-sm shrink-0"
                style={{
                  backgroundColor: value.valueRow.backgroundColor,
                  border: `1px solid ${value.valueRow.borderColor}`,
                }}
              />
              <span className="dial-tiny-text text-primary whitespace-nowrap">{value.valueRow.value}</span>
            </div>
          )}
          {!value.valueRow && value.valueText != null && (
            <span className="dial-tiny-text text-primary whitespace-nowrap">{value.valueText}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatMapCellTooltip;
