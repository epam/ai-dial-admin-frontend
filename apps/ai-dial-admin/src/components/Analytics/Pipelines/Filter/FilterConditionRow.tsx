'use client';

import { FC, useMemo } from 'react';
import classNames from 'classnames';
import { GhostIconButton, Input, Select, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { withStrandedOption } from '@/src/components/Analytics/Pipelines/Common/utils';
import {
  getRowIssue,
  isValuelessOperator,
  splitInValues,
} from '@/src/components/Analytics/Pipelines/Filter/filter-sql';
import {
  PipelineFilterOperator,
  PipelineFilterRow,
  PipelineFilterRowIssue,
} from '@/src/components/Analytics/Pipelines/Filter/models';
import { operatorOptionsForType } from '@/src/components/Analytics/QueryBuilder/utils/operators';
import { PIPELINE_SELECT_DEFAULTS } from '@/src/constants/analytics/pipelines';
import { OPERATOR_OPTION_DESCRIPTORS } from '@/src/constants/analytics/query-builder';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

interface Props {
  row: PipelineFilterRow;
  index: number;
  fields: AnalyticsEntityField[];
  onChange: (patch: Partial<PipelineFilterRow>) => void;
  onDelete: () => void;
}

// Projection-only types: the service admits no comparison over them, so they are never a condition's column.
const UNCOMPARABLE_TYPES = [AnalyticsFieldType.Object, AnalyticsFieldType.Array, AnalyticsFieldType.Map];

const BOOLEAN_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
];

// Incomplete is absent on purpose: a row still being filled in is counted under the list, not marked wrong.
const ISSUE_MESSAGES: Partial<Record<PipelineFilterRowIssue, AnalyticsPipelinesI18nKey>> = {
  [PipelineFilterRowIssue.Wildcard]: AnalyticsPipelinesI18nKey.FilterWildcard,
  [PipelineFilterRowIssue.InvalidNumber]: AnalyticsPipelinesI18nKey.FilterInvalidNumber,
  [PipelineFilterRowIssue.InvalidBoolean]: AnalyticsPipelinesI18nKey.FilterInvalidBoolean,
  [PipelineFilterRowIssue.InvalidDate]: AnalyticsPipelinesI18nKey.FilterInvalidDate,
  [PipelineFilterRowIssue.InvalidTimestamp]: AnalyticsPipelinesI18nKey.FilterInvalidTimestamp,
};

const FilterConditionRow: FC<Props> = ({ row, index, fields, onChange, onDelete }) => {
  const t = useI18n();

  const field = fields.find((candidate) => candidate.name === row.field);
  const isIn = row.operator === PipelineFilterOperator.In;
  const issue = getRowIssue(row, fields);
  const issueKey = issue ? ISSUE_MESSAGES[issue] : undefined;
  const error = issueKey ? t(issueKey) : undefined;

  const columnOptions = useMemo(
    () =>
      fields
        .filter((candidate) => !UNCOMPARABLE_TYPES.includes(candidate.type))
        .map((candidate) => ({ value: candidate.name, label: `${candidate.name} · ${candidate.type}` })),
    [fields],
  );

  const allOperatorOptions: SelectOption[] = useMemo(
    () => [
      ...OPERATOR_OPTION_DESCRIPTORS.map((descriptor) => ({ value: descriptor.value, label: t(descriptor.labelKey) })),
      { value: PipelineFilterOperator.IsEmpty, label: t(AnalyticsPipelinesI18nKey.FilterIsEmpty) },
      { value: PipelineFilterOperator.IsNotEmpty, label: t(AnalyticsPipelinesI18nKey.FilterIsNotEmpty) },
    ],
    [t],
  );
  const operatorOptions = operatorOptionsForType(allOperatorOptions, field?.type);

  // A new column may not admit the operator the row had, and a value typed for the old one rarely fits it.
  const onChangeColumn = (name: string) => {
    const type = fields.find((candidate) => candidate.name === name)?.type;
    const isAdmitted = operatorOptionsForType(allOperatorOptions, type).some((option) => option.value === row.operator);
    onChange({ field: name, operator: isAdmitted ? row.operator : PipelineFilterOperator.Eq, value: '' });
  };

  const valuePlaceholder = (): string | undefined => {
    if (isIn) return t(AnalyticsPipelinesI18nKey.FilterInPlaceholder);
    if (field?.type === AnalyticsFieldType.Date) return t(AnalyticsPipelinesI18nKey.FilterDatePlaceholder);
    if (field?.type === AnalyticsFieldType.Timestamp) return t(AnalyticsPipelinesI18nKey.FilterTimestampPlaceholder);
    return undefined;
  };

  // Only the first row draws its labels: the rows below line up under them, and repeating Column / Operator /
  // Value on every row reads as noise. Every control keeps its name for assistive technology either way.
  const isLabelled = index === 0;
  const selectLabel = (key: AnalyticsPipelinesI18nKey) =>
    isLabelled ? { labelProps: { label: t(key) } } : { ariaLabel: t(key) };
  const inputLabel = (key: AnalyticsPipelinesI18nKey) =>
    isLabelled ? { labelProps: { label: t(key) } } : { 'aria-label': t(key) };

  const valueId = `filter-condition-value-${index}`;

  const renderValue = () => {
    if (isValuelessOperator(row.operator)) return null;

    if (field?.type === AnalyticsFieldType.Enum && field.enum_values?.length) {
      const options = field.enum_values.map((value) => ({ value, label: value }));
      return (
        <Select
          {...PIPELINE_SELECT_DEFAULTS}
          id={valueId}
          className="min-w-[180px] flex-1"
          {...selectLabel(AnalyticsPipelinesI18nKey.FilterValue)}
          multiple={isIn}
          options={options}
          value={isIn ? splitInValues(row.value) : row.value}
          onChange={(next) => onChange({ value: Array.isArray(next) ? next.join(', ') : next })}
        />
      );
    }

    if (field?.type === AnalyticsFieldType.Boolean && !isIn) {
      return (
        <Select
          {...PIPELINE_SELECT_DEFAULTS}
          id={valueId}
          className="min-w-[180px] flex-1"
          {...selectLabel(AnalyticsPipelinesI18nKey.FilterValue)}
          options={BOOLEAN_OPTIONS}
          value={row.value}
          onChange={(next) => onChange({ value: next as string })}
        />
      );
    }

    return (
      <Input
        id={valueId}
        containerClassName="min-w-[180px] flex-1"
        {...inputLabel(AnalyticsPipelinesI18nKey.FilterValue)}
        value={row.value}
        placeholder={valuePlaceholder()}
        error={error}
        invalid={!!error}
        spellCheck={false}
        onChange={(next) => onChange({ value: next ?? '' })}
      />
    );
  };

  return (
    <div
      role="group"
      aria-label={t(AnalyticsPipelinesI18nKey.FilterCondition, { index: index + 1 })}
      className="flex flex-row flex-wrap items-start gap-3"
    >
      <Select
        {...PIPELINE_SELECT_DEFAULTS}
        id={`filter-condition-column-${index}`}
        className="min-w-[180px] flex-1"
        {...selectLabel(AnalyticsPipelinesI18nKey.FilterColumn)}
        options={withStrandedOption(columnOptions, row.field)}
        value={row.field}
        onChange={(next) => onChangeColumn(next as string)}
      />
      <Select
        {...PIPELINE_SELECT_DEFAULTS}
        id={`filter-condition-operator-${index}`}
        className="min-w-[180px] flex-1"
        {...selectLabel(AnalyticsPipelinesI18nKey.FilterOperator)}
        options={withStrandedOption(operatorOptions, row.operator)}
        value={row.operator}
        onChange={(next) => onChange({ operator: next as PipelineFilterOperator })}
      />
      {renderValue()}
      <GhostIconButton
        className={classNames('shrink-0', isLabelled && 'mt-6')}
        icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} className="text-error" aria-hidden />}
        aria-label={t(ButtonsI18nKey.Delete)}
        onClick={onDelete}
      />
    </div>
  );
};

export default FilterConditionRow;
