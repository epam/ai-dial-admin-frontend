'use client';

import { FC } from 'react';

import classNames from 'classnames';

import BackfillSection from '@/src/components/Analytics/Common/BackfillSidebar/BackfillSection';
import BackfillStatusBadge from '@/src/components/Analytics/Common/BackfillSidebar/BackfillStatusBadge';
import { PIPELINE_BACKFILL_LIST_LIMIT } from '@/src/constants/analytics/backfill';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineBackfillRun } from '@/src/models/analytics/pipeline-backfill';
import {
  formatBackfillWindow,
  getPipelineBackfillStatus,
  getTodayUtc,
  getWindowView,
} from '@/src/utils/analytics/backfill';

interface Props {
  runs: PipelineBackfillRun[];
  isGroupTrigger: boolean;
  selectedRunId?: string;
  onSelect: (runId: string) => void;
}

/**
 * The pipeline's latest runs, newest first. The listing has no total and no next page, so a list as long as the
 * limit may be a prefix of a longer one, and says so.
 */
const PipelineBackfillRunsList: FC<Props> = ({ runs, isGroupTrigger, selectedRunId, onSelect }) => {
  const t = useI18n();
  if (runs.length === 0) return null;

  return (
    <BackfillSection title={t(BackfillI18nKey.RecentRuns)}>
      <ul className="m-0 flex list-none flex-col gap-y-1 p-0">
        {runs.map((run) => {
          const isSelected = run.id === selectedRunId;

          return (
            <li key={run.id}>
              <button
                type="button"
                aria-current={isSelected}
                className={classNames(
                  'flex w-full items-center justify-between gap-x-2 rounded px-2 py-2 text-left dial-small hover:bg-layer-3 focus-visible:bg-layer-3',
                  isSelected && 'bg-layer-3',
                )}
                onClick={() => onSelect(run.id)}
              >
                <BackfillStatusBadge status={getPipelineBackfillStatus(run.state, isGroupTrigger)} />
                <span className="min-w-0 flex-1 truncate text-primary">
                  {formatBackfillWindow(getWindowView(run.window_from, run.window_to), getTodayUtc(new Date()), t)}
                </span>
                <span className="shrink-0 text-secondary">{run.rows_done.toLocaleString()}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {runs.length >= PIPELINE_BACKFILL_LIST_LIMIT && (
        <p className="m-0 text-secondary dial-tiny">{t(BackfillI18nKey.RunsLatestOnly)}</p>
      )}
    </BackfillSection>
  );
};

export default PipelineBackfillRunsList;
