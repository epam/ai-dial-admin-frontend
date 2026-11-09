'use client';

import { IconMinus } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';

import { ChevronBadge } from '@/src/components/Common/ChevronBadge/ChevronBadge';
import { formatHeatMapCellValue } from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import {
  GroupedAnalyticsResult,
  OverallScoreCellValue,
  TestCaseThresholdStatus,
} from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const OverallScoreCellRenderer = ({ value }: ICellRendererParams<GroupedAnalyticsResult, OverallScoreCellValue>) => {
  const t = useI18n();
  if (value == null) return null;

  const { score, thresholdStatus } = value;
  const displayScore = typeof score === 'number' ? formatHeatMapCellValue(score) : score;
  const isPass = thresholdStatus === TestCaseThresholdStatus.Pass;
  const isFail = thresholdStatus === TestCaseThresholdStatus.Fail;
  let statusLabel = t(RunsI18nKey.NotApplicable);
  if (isPass) {
    statusLabel = t(RunsI18nKey.Above);
  } else if (isFail) {
    statusLabel = t(RunsI18nKey.Below);
  }
  const accessibleLabel = thresholdStatus == null ? displayScore : `${displayScore}, ${statusLabel}`;

  return (
    <span
      className="inline-flex size-full items-center justify-end gap-1 px-3"
      role="group"
      aria-label={accessibleLabel}
    >
      {(isPass || isFail) && <ChevronBadge isPositive={isPass} />}
      {thresholdStatus != null && !isPass && !isFail && <IconMinus className="text-secondary" size={12} aria-hidden />}
      <span className="text-primary" aria-hidden>
        {displayScore}
      </span>
    </span>
  );
};

export default OverallScoreCellRenderer;
