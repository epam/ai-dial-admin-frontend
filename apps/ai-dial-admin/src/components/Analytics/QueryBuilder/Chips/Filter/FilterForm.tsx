'use client';

import { FC, useId, useMemo } from 'react';

import { Input, Select } from '@epam/ai-dial-ui-kit';

import { FILTER_OPERATOR_I18N } from '@/src/components/Analytics/QueryBuilder/Chips/constants';
import {
  FilterChipForm,
  FilterChipOperator,
  FilterValueKind,
} from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  filterOperatorChoices,
  filterValueKind,
  splitListValue,
  withFilterField,
  withFilterOperator,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/filter';
import { toSelectOptions, valuesToSelectOptions } from '@/src/components/Analytics/QueryBuilder/Chips/utils/options';
import { comparableFieldOptions, fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { BasicI18nKey, QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  form: FilterChipForm;
  fields: AnalyticsEntityField[];
  onChange: (form: FilterChipForm) => void;
}

const BOOLEAN_VALUES = ['true', 'false'];

const FilterForm: FC<Props> = ({ form, fields, onChange }) => {
  const t = useI18n();
  const id = useId();

  const field = fields.find((entry) => entry.name === form.field);
  const kind = filterValueKind(form.operator, field?.type);
  const valueLabel = { label: t(QueryChipsI18nKey.Value) };

  const columnOptions = useMemo(
    () => toSelectOptions(comparableFieldOptions(fieldsToOptions(fields), [form.field])),
    [fields, form.field],
  );
  const operatorOptions = filterOperatorChoices(field?.type).map((operator) => ({
    value: operator,
    label: t(FILTER_OPERATOR_I18N[operator]).toLowerCase(),
  }));
  const enumOptions = valuesToSelectOptions(field?.enum_values ?? []);
  const booleanOptions = [
    { value: BOOLEAN_VALUES[0], label: t(QueryChipsI18nKey.ValueTrue) },
    { value: BOOLEAN_VALUES[1], label: t(QueryChipsI18nKey.ValueFalse) },
  ];

  return (
    <>
      <Select
        id={`${id}-column`}
        searchable
        searchPlaceholder={t(BasicI18nKey.Search)}
        labelProps={{ label: t(QueryChipsI18nKey.Column) }}
        options={columnOptions}
        value={form.field}
        onChange={(value) => onChange(withFilterField(form, value as string, fields))}
      />
      <Select
        id={`${id}-operator`}
        labelProps={{ label: t(QueryBuilderI18nKey.Operator) }}
        options={operatorOptions}
        value={form.operator}
        onChange={(value) => onChange(withFilterOperator(form, value as FilterChipOperator, fields))}
      />
      {kind === FilterValueKind.Text && (
        <Input
          id={`${id}-value`}
          labelProps={valueLabel}
          value={form.value}
          onChange={(value) => onChange({ ...form, value: value ?? '' })}
        />
      )}
      {kind === FilterValueKind.TextList && (
        <Input
          id={`${id}-value`}
          labelProps={valueLabel}
          placeholder={t(QueryChipsI18nKey.ValueList)}
          value={form.value}
          onChange={(value) => onChange({ ...form, value: value ?? '', values: splitListValue(value ?? '') })}
        />
      )}
      {(kind === FilterValueKind.Enum || kind === FilterValueKind.Boolean) && (
        <Select
          id={`${id}-value`}
          labelProps={valueLabel}
          options={kind === FilterValueKind.Enum ? enumOptions : booleanOptions}
          value={form.value}
          onChange={(value) => onChange({ ...form, value: value as string })}
        />
      )}
      {kind === FilterValueKind.EnumList && (
        <Select
          id={`${id}-value`}
          multiple
          labelProps={valueLabel}
          options={enumOptions}
          value={form.values}
          onChange={(value) => onChange({ ...form, values: value as string[] })}
        />
      )}
    </>
  );
};

export default FilterForm;
