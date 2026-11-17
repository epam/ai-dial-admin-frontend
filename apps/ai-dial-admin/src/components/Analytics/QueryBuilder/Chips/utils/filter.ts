import {
  FilterChipForm,
  FilterChipOperator,
  FilterValueKind,
} from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { defaultValueType, typeOf } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { ENUM_UNSUPPORTED_OPERATORS } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator } from '@/src/models/analytics/query';
import { FilterPredicateNode } from '@/src/models/analytics/query-builder';

const LIST_SEPARATOR = ',';

const NULL_OPERATORS: Partial<Record<FilterChipOperator, QueryOperator>> = {
  [FilterChipOperator.IsEmpty]: QueryOperator.Eq,
  [FilterChipOperator.IsNotEmpty]: QueryOperator.Ne,
};

export const splitListValue = (value: string): string[] =>
  value
    .split(LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);

export const isNullOperator = (operator: FilterChipOperator): boolean => operator in NULL_OPERATORS;

export const filterOperatorChoices = (fieldType?: string): FilterChipOperator[] =>
  Object.values(FilterChipOperator).filter(
    (operator) =>
      fieldType !== AnalyticsFieldType.Enum ||
      !ENUM_UNSUPPORTED_OPERATORS.includes(operator as unknown as QueryOperator),
  );

export const filterOperatorForType = (operator: FilterChipOperator, fieldType?: string): FilterChipOperator =>
  filterOperatorChoices(fieldType).includes(operator) ? operator : FilterChipOperator.Equals;

export const filterValueKind = (operator: FilterChipOperator, fieldType?: string): FilterValueKind => {
  if (isNullOperator(operator)) return FilterValueKind.None;
  const isList = operator === FilterChipOperator.InList;
  if (fieldType === AnalyticsFieldType.Enum) return isList ? FilterValueKind.EnumList : FilterValueKind.Enum;
  if (isList) return FilterValueKind.TextList;
  return fieldType === AnalyticsFieldType.Boolean ? FilterValueKind.Boolean : FilterValueKind.Text;
};

export const createFilterForm = (): FilterChipForm => ({
  field: '',
  operator: FilterChipOperator.Equals,
  value: '',
  values: [],
});

export const toFilterForm = (predicate: FilterPredicateNode): FilterChipForm => {
  if (predicate.isNull) {
    const operator = predicate.op === QueryOperator.Ne ? FilterChipOperator.IsNotEmpty : FilterChipOperator.IsEmpty;
    return { field: predicate.field, operator, value: '', values: [] };
  }
  const isList = predicate.op === QueryOperator.In;
  return {
    field: predicate.field,
    operator: predicate.op as unknown as FilterChipOperator,
    value: predicate.value,
    values: isList ? splitListValue(predicate.value) : [],
  };
};

export const withFilterField = (
  form: FilterChipForm,
  field: string,
  fields: AnalyticsEntityField[],
): FilterChipForm => ({
  field,
  operator: filterOperatorForType(form.operator, typeOf(fields, field)),
  value: '',
  values: [],
});

export const withFilterOperator = (
  form: FilterChipForm,
  operator: FilterChipOperator,
  fields: AnalyticsEntityField[],
): FilterChipForm => {
  const fieldType = typeOf(fields, form.field);
  const isSameKind = filterValueKind(form.operator, fieldType) === filterValueKind(operator, fieldType);
  return isSameKind ? { ...form, operator } : { ...form, operator, value: '', values: [] };
};

export const isFilterFormValid = (form: FilterChipForm, fields: AnalyticsEntityField[]): boolean => {
  if (!form.field) return false;
  const kind = filterValueKind(form.operator, typeOf(fields, form.field));
  if (kind === FilterValueKind.None) return true;
  if (kind === FilterValueKind.TextList || kind === FilterValueKind.EnumList) return form.values.length > 0;
  return form.value.trim() !== '';
};

export const toFilterPredicate = (
  form: FilterChipForm,
  fields: AnalyticsEntityField[],
  id?: string,
): FilterPredicateNode => {
  const fieldType = typeOf(fields, form.field);
  const base = createPredicate(fieldType);
  const nullOperator = NULL_OPERATORS[form.operator];
  const isList = form.operator === FilterChipOperator.InList;

  return {
    ...base,
    id: id ?? base.id,
    field: form.field,
    op: nullOperator ?? (form.operator as unknown as QueryOperator),
    valueType: defaultValueType(fieldType),
    value: isList ? form.values.join(`${LIST_SEPARATOR} `) : form.value.trim(),
    isNull: !!nullOperator,
  };
};
