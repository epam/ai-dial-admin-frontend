import {
  PipelineFilterMatch,
  PipelineFilterOperator,
  PipelineFilterRow,
  PipelineFilterRowIssue,
  RenderedPipelineFilter,
} from '@/src/components/Analytics/Pipelines/Filter/models';
import { defaultValueType } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryValueType } from '@/src/models/analytics/query';

// Every rule below mirrors the service's own StructuredQueryToSqlRenderer, so the string the builder writes is
// the one the service would write for the same condition — and reads back the way the author meant it.

const COMPARISON_SQL: Partial<Record<PipelineFilterOperator, string>> = {
  [PipelineFilterOperator.Eq]: '=',
  [PipelineFilterOperator.Ne]: '<>',
  [PipelineFilterOperator.Lt]: '<',
  [PipelineFilterOperator.Gt]: '>',
  [PipelineFilterOperator.Le]: '<=',
  [PipelineFilterOperator.Ge]: '>=',
};

const INTEGER = /^-?\d+$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,3})?$/;
const BOOLEAN = ['true', 'false'];

export const quoteIdentifier = (name: string): string => `"${name.replace(/"/g, '""')}"`;

export const quoteString = (value: string): string => `'${value.replace(/'/g, "''")}'`;

export const isValuelessOperator = (operator: PipelineFilterOperator): boolean =>
  operator === PipelineFilterOperator.IsEmpty || operator === PipelineFilterOperator.IsNotEmpty;

const isContainsOperator = (operator: PipelineFilterOperator): boolean =>
  operator === PipelineFilterOperator.Contains || operator === PipelineFilterOperator.NotContains;

export const fieldValueType = (fields: AnalyticsEntityField[], name: string): QueryValueType =>
  defaultValueType(fields.find((field) => field.name === name)?.type);

const isTextType = (valueType: QueryValueType): boolean =>
  valueType === QueryValueType.String || valueType === QueryValueType.Uuid;

// A single value as it is written: text exactly as typed, since an edge space is part of a string literal, and
// anything else trimmed, since `7 ` means 7.
const singleValue = (row: PipelineFilterRow, valueType: QueryValueType): string =>
  isTextType(valueType) ? row.value : row.value.trim();

export const splitInValues = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length);

const literalIssue = (valueType: QueryValueType, text: string): PipelineFilterRowIssue | undefined => {
  switch (valueType) {
    case QueryValueType.Integer:
    case QueryValueType.Long:
      return INTEGER.test(text) ? undefined : PipelineFilterRowIssue.InvalidNumber;
    case QueryValueType.Decimal:
      return DECIMAL.test(text) ? undefined : PipelineFilterRowIssue.InvalidNumber;
    case QueryValueType.Boolean:
      return BOOLEAN.includes(text) ? undefined : PipelineFilterRowIssue.InvalidBoolean;
    case QueryValueType.Date:
      return DATE.test(text) ? undefined : PipelineFilterRowIssue.InvalidDate;
    case QueryValueType.Timestamp:
      return TIMESTAMP.test(text) ? undefined : PipelineFilterRowIssue.InvalidTimestamp;
    default:
      return undefined;
  }
};

const renderLiteral = (valueType: QueryValueType, text: string): string => {
  switch (valueType) {
    case QueryValueType.Integer:
    case QueryValueType.Long:
    case QueryValueType.Decimal:
      return text;
    case QueryValueType.Boolean:
      return text.toUpperCase();
    case QueryValueType.Date:
      return `DATE ${quoteString(text)}`;
    case QueryValueType.Timestamp:
      return `TIMESTAMP ${quoteString(text)}`;
    default:
      return quoteString(text);
  }
};

// The first reason a row cannot be written, or undefined when it can.
export const getRowIssue = (
  row: PipelineFilterRow,
  fields: AnalyticsEntityField[],
): PipelineFilterRowIssue | undefined => {
  if (!row.field) return PipelineFilterRowIssue.Incomplete;
  if (isValuelessOperator(row.operator)) return undefined;
  if (isContainsOperator(row.operator)) {
    if (!row.value) return PipelineFilterRowIssue.Incomplete;
    // The SQL subset has no escape for a LIKE wildcard, so `%a_b%` would match more than the author typed.
    return /[%_]/.test(row.value) ? PipelineFilterRowIssue.Wildcard : undefined;
  }
  const valueType = fieldValueType(fields, row.field);
  const items = row.operator === PipelineFilterOperator.In ? splitInValues(row.value) : [singleValue(row, valueType)];
  if (!items.length || items.some((item) => !item)) return PipelineFilterRowIssue.Incomplete;
  return items.map((item) => literalIssue(valueType, item)).find(Boolean);
};

const renderRow = (row: PipelineFilterRow, fields: AnalyticsEntityField[]): string => {
  const column = quoteIdentifier(row.field);
  const valueType = fieldValueType(fields, row.field);
  switch (row.operator) {
    case PipelineFilterOperator.IsEmpty:
      return `${column} IS NULL`;
    case PipelineFilterOperator.IsNotEmpty:
      return `${column} IS NOT NULL`;
    case PipelineFilterOperator.Contains:
      return `${column} ILIKE ${quoteString(`%${row.value}%`)}`;
    case PipelineFilterOperator.NotContains:
      return `${column} NOT ILIKE ${quoteString(`%${row.value}%`)}`;
    case PipelineFilterOperator.In:
      return `${column} IN (${splitInValues(row.value)
        .map((item) => renderLiteral(valueType, item))
        .join(', ')})`;
    default:
      return `${column} ${COMPARISON_SQL[row.operator]} ${renderLiteral(valueType, singleValue(row, valueType))}`;
  }
};

// Conditions are one comparison each, so a flat list needs no parentheses; the service's own outer pair is
// left off because it reads worse in the SQL view and means the same. A row with no column yet is not counted
// as skipped: it is a row just added, not a condition the author expects to apply.
export const renderFilterSql = (
  rows: PipelineFilterRow[],
  match: PipelineFilterMatch,
  fields: AnalyticsEntityField[],
): RenderedPipelineFilter => {
  const written = rows.filter((row) => !getRowIssue(row, fields));
  const separator = match === PipelineFilterMatch.Any ? ' OR ' : ' AND ';
  return {
    sql: written.map((row) => renderRow(row, fields)).join(separator),
    skippedCount: rows.filter((row) => row.field && getRowIssue(row, fields)).length,
  };
};

export const createFilterRow = (): PipelineFilterRow => ({
  id: crypto.randomUUID(),
  field: '',
  operator: PipelineFilterOperator.Eq,
  value: '',
});
