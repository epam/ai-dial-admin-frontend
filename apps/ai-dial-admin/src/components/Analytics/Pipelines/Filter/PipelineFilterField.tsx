'use client';

import { FC } from 'react';
import classNames from 'classnames';
import { GhostButton, RadioGroup, RadioGroupItem, RadioGroupOrientation, Select } from '@epam/ai-dial-ui-kit';

import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import FilterConditionRow from '@/src/components/Analytics/Pipelines/Filter/FilterConditionRow';
import { createFilterRow } from '@/src/components/Analytics/Pipelines/Filter/filter-sql';
import {
  PipelineFilterMatch,
  PipelineFilterRow,
  PipelineFilterUnavailableReason,
  PipelineFilterView,
} from '@/src/components/Analytics/Pipelines/Filter/models';
import { usePipelineFilter } from '@/src/components/Analytics/Pipelines/Filter/use-pipeline-filter';
import { PIPELINE_SELECT_DEFAULTS } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  className?: string;
  value?: string;
  sourceName?: string;
  isSourcePending?: boolean;
  hasFieldsError?: boolean;
  /** The source's entity, so a column an enrichment supplies is offered under its qualified name. */
  fields: AnalyticsEntityField[];
  onChange: (value?: string) => void;
}

const UNAVAILABLE_MESSAGES: Record<PipelineFilterUnavailableReason, AnalyticsPipelinesI18nKey> = {
  [PipelineFilterUnavailableReason.Unparsed]: AnalyticsPipelinesI18nKey.FilterUnavailableUnparsed,
  [PipelineFilterUnavailableReason.NotFlat]: AnalyticsPipelinesI18nKey.FilterUnavailableNotFlat,
  [PipelineFilterUnavailableReason.NoSource]: AnalyticsPipelinesI18nKey.FilterUnavailableNoSource,
  [PipelineFilterUnavailableReason.NoSchema]: AnalyticsPipelinesI18nKey.FilterUnavailableNoSchema,
};

const PipelineFilterField: FC<Props> = ({
  className,
  value,
  sourceName,
  isSourcePending,
  hasFieldsError,
  fields,
  onChange,
}) => {
  const t = useI18n();
  const filter = usePipelineFilter({
    filter: value,
    sourceName,
    isSourcePending,
    hasFieldsError,
    fields,
    onChange,
  });
  const { rows, match, unavailableReason, skippedCount } = filter;

  // Until the filter has been read the text is what there is to show, and it stays editable meanwhile.
  const isBuilder = filter.view === PipelineFilterView.Builder;

  const viewItems: RadioGroupItem[] = [
    {
      value: PipelineFilterView.Builder,
      label: t(AnalyticsPipelinesI18nKey.FilterViewBuilder),
      disabled: filter.isPending || !!unavailableReason,
    },
    { value: PipelineFilterView.Sql, label: t(AnalyticsPipelinesI18nKey.FilterViewSql) },
  ];

  const matchOptions = [
    { value: PipelineFilterMatch.All, label: t(AnalyticsPipelinesI18nKey.FilterMatchAll) },
    { value: PipelineFilterMatch.Any, label: t(AnalyticsPipelinesI18nKey.FilterMatchAny) },
  ];

  const viewCaption = () => {
    if (filter.isParsing) return t(AnalyticsPipelinesI18nKey.FilterReading);
    return unavailableReason ? t(UNAVAILABLE_MESSAGES[unavailableReason]) : undefined;
  };

  const onChangeRow = (id: string, patch: Partial<PipelineFilterRow>) =>
    filter.onChangeRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <div className={classNames('flex flex-col gap-4', className)}>
      <RadioGroup
        id="pipeline-filter-view"
        labelProps={{ label: t(AnalyticsPipelinesI18nKey.Filter) }}
        orientation={RadioGroupOrientation.Row}
        items={viewItems}
        value={filter.view ?? PipelineFilterView.Sql}
        caption={viewCaption()}
        onChange={(next) => filter.onChangeView(next as PipelineFilterView)}
      />

      {!isBuilder && (
        <SqlPredicateField
          id="pipeline-filter"
          label={t(AnalyticsPipelinesI18nKey.Filter)}
          isLabelHidden
          description={t(AnalyticsPipelinesI18nKey.FilterCaption)}
          value={value}
          sourceName={sourceName}
          onChange={(next) => onChange(next || undefined)}
        />
      )}

      {isBuilder && (
        <div role="group" aria-label={t(AnalyticsPipelinesI18nKey.Filter)} className="flex flex-col gap-3">
          <Select
            {...PIPELINE_SELECT_DEFAULTS}
            id="pipeline-filter-match"
            className="max-w-[280px]"
            labelProps={{ label: t(AnalyticsPipelinesI18nKey.FilterMatch) }}
            options={matchOptions}
            value={match}
            onChange={(next) => filter.onChangeMatch(next as PipelineFilterMatch)}
          />
          {rows.map((row, index) => (
            <FilterConditionRow
              key={row.id}
              row={row}
              index={index}
              fields={fields}
              onChange={(patch) => onChangeRow(row.id, patch)}
              onDelete={() => filter.onChangeRows(rows.filter((candidate) => candidate.id !== row.id))}
            />
          ))}
          <GhostButton
            className="self-start"
            label={t(AnalyticsPipelinesI18nKey.FilterAddCondition)}
            onClick={() => filter.onChangeRows([...rows, createFilterRow()])}
          />
          <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.FilterCaption)}</span>
        </div>
      )}

      {/* Mounted in both views so the count is announced as it changes, not only when the region appears. A
          bare live region rather than role="status": the detail page already answers to that role for its
          runtime alerts, and a second, always-present one would compete with them. */}
      <span aria-live="polite" className={classNames('text-error dial-tiny-text', !skippedCount && 'sr-only')}>
        {isBuilder && skippedCount ? t(AnalyticsPipelinesI18nKey.FilterSkipped, { count: skippedCount }) : ''}
      </span>
    </div>
  );
};

export default PipelineFilterField;
