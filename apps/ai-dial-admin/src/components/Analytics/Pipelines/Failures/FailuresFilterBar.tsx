'use client';

import { FC } from 'react';

import { ElementSize, Search, Select, Tag } from '@epam/ai-dial-ui-kit';

import { PIPELINE_SELECT_DEFAULTS } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DlqFilters, DlqLane } from '@/src/models/analytics/pipeline-dlq';

/** The select's own value for "no lane at all", since a select has no empty option. */
const EVERY_PATH = 'all';

interface Props {
  filters: DlqFilters;
  search: string;
  /** A re-run is in flight, whose re-read is bound to the filters it started under. */
  isDisabled: boolean;
  onLaneChange: (lane?: DlqLane) => void;
  onRunChange: (runId?: string) => void;
  onSearchChange: (term: string) => void;
}

/**
 * The grid's two filters: the path, which narrows the request, and the search, which narrows the rows
 * that came back.
 *
 * The run filter **replaces** the path control rather than sitting beside it. A run is a backfill run
 * by definition, so the two cannot disagree — and the service refuses a request naming the live path
 * and a run together rather than answering the empty list that combination selects.
 *
 * The search field is always open. Behind a toggle it had two lifetimes — the term outlived the grid
 * while the field did not — so a reopened card came back filtered with nothing on screen saying so.
 */
const FailuresFilterBar: FC<Props> = ({ filters, search, isDisabled, onLaneChange, onRunChange, onSearchChange }) => {
  const t = useI18n();

  const pathOptions = [
    { value: EVERY_PATH, label: t(AnalyticsPipelinesI18nKey.FailuresPathAll) },
    { value: DlqLane.Live, label: t(AnalyticsPipelinesI18nKey.FailuresPathLive) },
    { value: DlqLane.Backfill, label: t(AnalyticsPipelinesI18nKey.FailuresPathBackfill) },
  ];

  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      {filters.runId ? (
        <Tag
          label={t(AnalyticsPipelinesI18nKey.FailuresRunFilter, { id: filters.runId })}
          closable
          disabled={isDisabled}
          removeLabel={t(AnalyticsPipelinesI18nKey.FailuresClearRun)}
          onRemove={() => onRunChange(undefined)}
        />
      ) : (
        <Select
          {...PIPELINE_SELECT_DEFAULTS}
          className="w-[180px]"
          size={ElementSize.Small}
          // Named for assistive technology only. On screen the three values say what they select, and
          // a visible "Path" in front of them repeats the word on every reading of the field.
          ariaLabel={t(AnalyticsPipelinesI18nKey.FailuresPath)}
          disabled={isDisabled}
          options={pathOptions}
          value={filters.lane ?? EVERY_PATH}
          onChange={(value) => onLaneChange(value === EVERY_PATH ? undefined : (value as DlqLane))}
        />
      )}

      <Search
        containerClassName="ml-auto w-[260px]"
        size={ElementSize.Small}
        aria-label={t(AnalyticsPipelinesI18nKey.FailuresSearch)}
        // The two fields it actually matches. "Search failures" says where you are, not what it will
        // compare, and the term that finds nothing is the one typed for the wrong field.
        placeholder={t(AnalyticsPipelinesI18nKey.FailuresSearchPlaceholder)}
        clearLabel={t(AnalyticsPipelinesI18nKey.FailuresClearSearch)}
        disabled={isDisabled}
        value={search}
        onChange={(value) => onSearchChange(value ?? '')}
      />
    </div>
  );
};

export default FailuresFilterBar;
