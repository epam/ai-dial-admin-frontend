'use client';

import { FC } from 'react';

import classNames from 'classnames';

import BackfillSection from '@/src/components/Analytics/Common/BackfillSidebar/BackfillSection';
import BackfillStatusBadge from '@/src/components/Analytics/Common/BackfillSidebar/BackfillStatusBadge';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TableBackfillRun } from '@/src/models/analytics/table-backfill';
import { getTableBackfillStatus } from '@/src/utils/analytics/backfill';

interface Props {
  runs: TableBackfillRun[];
  selectedRunId?: string;
  onSelect: (runId: string) => void;
}

/**
 * The runs the service still holds, newest first. With no run to list there is no block at all: an empty heading
 * tells the reader nothing the form beside it does not.
 */
const TableBackfillRunsList: FC<Props> = ({ runs, selectedRunId, onSelect }) => {
  const t = useI18n();

  if (runs.length === 0) return null;

  return (
    <BackfillSection title={t(BackfillI18nKey.RecentRuns)}>
      <ul className="m-0 flex list-none flex-col gap-y-1 p-0">
        {runs.map((run) => {
          const isSelected = run.runId === selectedRunId;

          return (
            <li key={run.runId}>
              <button
                type="button"
                aria-current={isSelected}
                className={classNames(
                  'flex w-full items-center justify-between gap-x-2 rounded px-2 py-2 text-left dial-small hover:bg-layer-3 focus-visible:bg-layer-3',
                  isSelected && 'bg-layer-3',
                )}
                onClick={() => onSelect(run.runId)}
              >
                <BackfillStatusBadge status={getTableBackfillStatus(run.state)} />
                <span className="min-w-0 flex-1 truncate text-primary">{`${run.from} → ${run.to}`}</span>
                <span className="shrink-0 text-secondary">{`${run.daysCompleted + run.daysFailed} / ${run.daysTotal}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </BackfillSection>
  );
};

export default TableBackfillRunsList;
