'use client';

import { ITooltipParams } from 'ag-grid-community';
import { FC, useMemo } from 'react';

import CommonHeatMapCellTooltip from '@/src/components/Common/HeatMap/HeatMapCellTooltip';
import { HeatMapCellTooltipContent } from '@/src/components/Common/HeatMap/models';
import { HeatMapCellTooltipData, HeatMapRow } from '@/src/components/Runs/Compare/HeatMap/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const HeatMapCellTooltip: FC<ITooltipParams<HeatMapRow, HeatMapCellTooltipData>> = (params) => {
  const t = useI18n();
  const value = params.value;

  const content = useMemo((): HeatMapCellTooltipContent | undefined => {
    if (!value) {
      return undefined;
    }

    const rows: { label: string; value: string }[] = [
      { label: t(RunsI18nKey.RunCompareHeatMapTooltipTestCase), value: value.testCase },
      { label: t(RunsI18nKey.RunCompareHeatMapTooltipMetric), value: value.metric },
      { label: t(RunsI18nKey.RunCompareHeatMapTooltipInput), value: value.input },
    ];

    if (value.runLabel) {
      rows.push({ label: t(RunsI18nKey.RunCompareHeatMapTooltipRun), value: value.runLabel });
    }

    return {
      rows,
      valueLabel: t(value.valueLabelKey),
      valueRow: value.valueRow,
      valueText: value.valueTextKey ? t(value.valueTextKey) : undefined,
    };
  }, [t, value]);

  return (
    <CommonHeatMapCellTooltip
      {...(params as unknown as ITooltipParams<unknown, HeatMapCellTooltipContent>)}
      value={content}
    />
  );
};

export default HeatMapCellTooltip;
