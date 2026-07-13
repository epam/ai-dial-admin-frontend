'use client';

import { ITooltipParams } from 'ag-grid-community';
import { FC } from 'react';

import { HeatMapCellTooltipData, HeatMapRow } from '@/src/components/Runs/Compare/HeatMap/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const HeatMapCellTooltip: FC<ITooltipParams<HeatMapRow, HeatMapCellTooltipData>> = ({ value }) => {
  const t = useI18n();

  if (!value) {
    return null;
  }

  const rows: { labelKey: RunsI18nKey; value: string }[] = [
    { labelKey: RunsI18nKey.RunCompareHeatMapTooltipTestCase, value: value.testCase },
    { labelKey: RunsI18nKey.RunCompareHeatMapTooltipMetric, value: value.metric },
    { labelKey: RunsI18nKey.RunCompareHeatMapTooltipInput, value: value.input },
  ];

  if (value.runLabel) {
    rows.push({ labelKey: RunsI18nKey.RunCompareHeatMapTooltipRun, value: value.runLabel });
  }

  const hasValueDisplay = value.valueRow != null || value.valueTextKey != null;

  return (
    <div className="flex flex-col items-center isolate">
      <div className="h-1 w-[9px] relative z-[2] -mb-px">
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div className="tooltip-arrow" />
        </div>
      </div>
      <div className="z-[1] flex gap-3 items-center rounded border border-primary bg-blackout px-2 py-1">
        <div className="flex flex-col gap-1 items-start shrink-0">
          {rows.map((row) => (
            <span key={row.labelKey} className="dial-tiny-text text-secondary whitespace-nowrap">
              {t(row.labelKey)}
            </span>
          ))}
          {hasValueDisplay && (
            <span className="dial-tiny-text text-secondary whitespace-nowrap">{t(value.valueLabelKey)}</span>
          )}
        </div>
        <div className="flex flex-col gap-1 items-start shrink-0">
          {rows.map((row) => (
            <span key={row.labelKey} className="dial-tiny-text text-primary whitespace-nowrap">
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
          {!value.valueRow && value.valueTextKey && (
            <span className="dial-tiny-text text-primary whitespace-nowrap">{t(value.valueTextKey)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeatMapCellTooltip;
