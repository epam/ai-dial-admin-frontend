'use client';

import { FC, useId, useMemo } from 'react';

import { ElementSize, GhostButton, GhostIconButton, Input, Select } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconTrashX } from '@tabler/icons-react';

import { TIME_BUCKET_I18N } from '@/src/components/Analytics/QueryBuilder/Chips/constants';
import { AggregateChipForm, TimeBucketChoice } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  aggregateChoiceByKey,
  aggregateFunctionChoices,
  isArgShown,
  isBucketOffered,
  timeBucketPresets,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/aggregate';
import { toSelectOptions, valuesToSelectOptions } from '@/src/components/Analytics/QueryBuilder/Chips/utils/options';
import {
  argumentFieldOptions,
  comparableFieldOptions,
  fieldsToOptions,
} from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  emptyArgs,
  functionByName,
  functionLabels,
  humanizeFunctionName,
  isExpressionArg,
  timeBinFunction,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { BasicI18nKey, QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { FnArgValue } from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';

interface Props {
  form: AggregateChipForm;
  fields: AnalyticsEntityField[];
  functions: QueryFunction[];
  onChange: (form: AggregateChipForm) => void;
}

const AggregateForm: FC<Props> = ({ form, fields, functions, onChange }) => {
  const t = useI18n();
  const id = useId();

  const bin = useMemo(() => timeBinFunction(functions), [functions]);
  const labels = useMemo(() => functionLabels(functions), [functions]);
  const choice = aggregateChoiceByKey(functions, form.functionKey);
  const fn = choice && functionByName(functions, choice.fn);

  const fieldOptions = useMemo(() => fieldsToOptions(fields), [fields]);
  const keyOptions = toSelectOptions(comparableFieldOptions(fieldOptions, [form.groupBy]));
  const secondaryOptions = toSelectOptions(
    comparableFieldOptions(fieldOptions, form.secondaryGroupBy ? [form.secondaryGroupBy] : []).filter(
      (option) => option.name !== form.groupBy,
    ),
  );
  const columnOptions = toSelectOptions(argumentFieldOptions(fieldOptions));

  const bucketOptions = [
    { value: TimeBucketChoice.None, label: t(QueryChipsI18nKey.BucketNone) },
    ...timeBucketPresets(bin).map((preset) => ({ value: preset.id, label: t(TIME_BUCKET_I18N[preset.id]) })),
    { value: TimeBucketChoice.Custom, label: t(QueryChipsI18nKey.BucketCustom) },
  ];
  const functionOptions = aggregateFunctionChoices(functions).map((entry) => {
    const name = labels.get(entry.fn) ?? entry.fn;
    return { value: entry.key, label: entry.isDistinct ? t(QueryChipsI18nKey.DistinctFunction, { name }) : name };
  });
  const functionLabel = functionOptions.find((option) => option.value === form.functionKey)?.label ?? '';

  const onChangeGroupBy = (groupBy: string) =>
    onChange({ ...form, groupBy, bucketId: TimeBucketChoice.None, customBucket: '' });

  const onChangeFunction = (functionKey: string) => {
    const next = functionByName(functions, aggregateChoiceByKey(functions, functionKey)?.fn ?? null);
    onChange({ ...form, functionKey, args: next ? emptyArgs(next) : [] });
  };

  const onChangeArg = (index: number, value: FnArgValue) =>
    onChange({ ...form, args: form.args.map((arg, i) => (i === index ? value : arg)) });

  return (
    <>
      <Select
        id={`${id}-group-by`}
        searchable
        searchPlaceholder={t(BasicI18nKey.Search)}
        labelProps={{ label: t(QueryBuilderI18nKey.GroupBy) }}
        options={keyOptions}
        value={form.groupBy}
        onChange={(value) => onChangeGroupBy(value as string)}
      />
      {isBucketOffered(form, fields, bin) && (
        <Select
          id={`${id}-bucket`}
          labelProps={{ label: t(QueryChipsI18nKey.SplitByPeriod) }}
          options={bucketOptions}
          value={form.bucketId}
          onChange={(value) => onChange({ ...form, bucketId: value as string })}
        />
      )}
      {isBucketOffered(form, fields, bin) && form.bucketId === TimeBucketChoice.Custom && (
        <Input
          id={`${id}-custom-bucket`}
          labelProps={{ label: t(QueryChipsI18nKey.BucketPeriod) }}
          placeholder={t(QueryChipsI18nKey.BucketPeriodPlaceholder)}
          value={form.customBucket}
          onChange={(value) => onChange({ ...form, customBucket: value ?? '' })}
        />
      )}
      {form.secondaryGroupBy == null ? (
        <div>
          <GhostButton
            label={t(QueryChipsI18nKey.AddSecondaryGrouping)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            onClick={() => onChange({ ...form, secondaryGroupBy: '' })}
          />
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Select
              id={`${id}-secondary`}
              searchable
              searchPlaceholder={t(BasicI18nKey.Search)}
              labelProps={{ label: t(QueryChipsI18nKey.SecondaryGroupBy) }}
              options={secondaryOptions}
              value={form.secondaryGroupBy}
              onChange={(value) => onChange({ ...form, secondaryGroupBy: value as string })}
            />
          </div>
          <GhostIconButton
            size={ElementSize.Standard}
            aria-label={t(QueryChipsI18nKey.RemoveSecondaryGrouping)}
            icon={<IconTrashX size={18} className="text-error" aria-hidden />}
            onClick={() => onChange({ ...form, secondaryGroupBy: null })}
          />
        </div>
      )}
      <Select
        id={`${id}-function`}
        labelProps={{ label: t(QueryChipsI18nKey.Function) }}
        options={functionOptions}
        value={form.functionKey}
        onChange={(value) => onChangeFunction(value as string)}
      />
      {fn &&
        choice &&
        fn.args.map((arg, index) => {
          if (!isArgShown(fn, index, choice.isDistinct)) return null;
          const value = form.args[index] ?? {};
          const argId = `${id}-arg-${arg.name}`;

          if (isExpressionArg(arg)) {
            return (
              <Select
                key={arg.name}
                id={argId}
                searchable
                searchPlaceholder={t(BasicI18nKey.Search)}
                labelProps={{ label: functionLabel }}
                options={columnOptions}
                value={value.field ?? ''}
                onChange={(next) => onChangeArg(index, { field: next as string })}
              />
            );
          }

          const allowed = arg.constraints?.allowed_values;
          return allowed ? (
            <Select
              key={arg.name}
              id={argId}
              labelProps={{ label: humanizeFunctionName(arg.name) }}
              options={valuesToSelectOptions(allowed)}
              value={value.literal ?? ''}
              onChange={(next) => onChangeArg(index, { literal: next as string })}
            />
          ) : (
            <Input
              key={arg.name}
              id={argId}
              type="number"
              min={arg.constraints?.min}
              max={arg.constraints?.max}
              labelProps={{ label: humanizeFunctionName(arg.name) }}
              value={value.literal ?? ''}
              onChange={(next) => onChangeArg(index, { literal: next ?? '' })}
            />
          );
        })}
    </>
  );
};

export default AggregateForm;
