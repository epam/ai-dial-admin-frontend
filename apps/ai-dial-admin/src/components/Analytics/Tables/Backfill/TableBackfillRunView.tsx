'use client';

import { FC } from 'react';

import { Button, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';

import BackfillRunFacts from '@/src/components/Analytics/Common/BackfillSidebar/BackfillRunFacts';
import BackfillStatusBadge from '@/src/components/Analytics/Common/BackfillSidebar/BackfillStatusBadge';
import { BackfillMetric } from '@/src/components/Analytics/Common/BackfillSidebar/models';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BackfillRerunRange, BackfillTone } from '@/src/models/analytics/backfill-ui';
import { TableBackfillRun, TableBackfillState } from '@/src/models/analytics/table-backfill';
import { canRerunTableBackfill, getRerunRange, getTableBackfillStatus } from '@/src/utils/analytics/backfill';

interface Props {
  run: TableBackfillRun;
  isAnyRunInProgress: boolean;
  isStarting: boolean;
  onRerun: (range: BackfillRerunRange) => void;
}

/**
 * One ingest run. `Failed` is the service's word for a run that stopped before its range; it is not inferred from
 * the counts, which sum to the total for a run that stops on its last day.
 */
const TableBackfillRunView: FC<Props> = ({ run, isAnyRunInProgress, isStarting, onRerun }) => {
  const t = useI18n();

  const isRunning = run.state === TableBackfillState.Running;
  const isAlreadyIngested =
    run.state === TableBackfillState.Completed && run.filesProcessed === 0 && run.daysFailed === 0;
  const rerunRange = canRerunTableBackfill(run, isAnyRunInProgress) ? getRerunRange(run) : null;

  const outcome: BackfillMetric[][] = [
    [
      { label: t(BackfillI18nKey.DaysTotal), value: run.daysTotal },
      {
        label: t(BackfillI18nKey.DaysCompleted),
        value: run.daysCompleted,
        tone: run.daysCompleted > 0 ? BackfillTone.Success : undefined,
      },
      {
        label: t(BackfillI18nKey.DaysFailed),
        value: run.daysFailed,
        tone: run.daysFailed > 0 ? BackfillTone.Error : undefined,
      },
    ],
    [
      { label: t(BackfillI18nKey.RowsInserted), value: run.rowsInserted.toLocaleString() },
      {
        label: t(BackfillI18nKey.RowsSkipped),
        value: run.rowsSkipped.toLocaleString(),
        hint: t(BackfillI18nKey.SkippedHint),
      },
      {
        label: t(BackfillI18nKey.RowsDropped),
        value: run.rowsDropped.toLocaleString(),
        hint: t(BackfillI18nKey.DroppedHint),
      },
    ],
  ];
  const metrics: BackfillMetric[] = [
    ...(isRunning && run.currentDate ? [{ label: t(BackfillI18nKey.CurrentDay), value: run.currentDate }] : []),
    { label: t(BackfillI18nKey.FilesProcessed), value: run.filesProcessed.toLocaleString() },
  ];

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <BackfillStatusBadge status={getTableBackfillStatus(run.state)} />
      </div>

      <BackfillRunFacts
        runId={run.runId}
        windowText={`${run.from} → ${run.to}`}
        outcome={outcome}
        metrics={metrics}
        startedAt={run.startedAt}
        finishedAt={run.finishedAt}
      />

      {isAlreadyIngested && <p className="m-0 text-secondary dial-small">{t(BackfillI18nKey.AlreadyIngested)}</p>}

      {rerunRange && (
        <Button
          variant={ButtonVariant.Secondary}
          size={ElementSize.Small}
          label={t(BackfillI18nKey.Rerun)}
          disabled={isStarting}
          onClick={() => onRerun(rerunRange)}
        />
      )}
    </div>
  );
};

export default TableBackfillRunView;
