import {
  DATE_FIELD_TYPES,
  NUMERIC_FIELD_TYPES,
  SPAN_COST_TAGS,
  SPAN_GROUP_SUMMARY_FIELD,
  SPAN_METERED_TAGS,
  UNTAGGED_SPAN_FIELD_TAG,
} from '@/src/constants/analytics/conversations-trace';
import {
  SpanFieldDescriptor,
  SpanFieldGroup,
  SpanFieldRow,
  SpanObjectEntry,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { formatSignificantCost, readableWords } from '@/src/utils/analytics/conversation-formatting';
import { formatDateTimeWithMillisToLocalString } from '@/src/utils/formatting/date';

const ARRAY_SEPARATOR = ', ';

const SPAN_SUMMARY_FIELD_TYPE = AnalyticsFieldType.Long;

// `request_tags` is the request's headers and `jwt_claims` the token's claims: both arrive as objects of
// tens of pairs.
export const spanObjectEntries = (value: unknown): SpanObjectEntry[] => {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([key, entry]) => ({ key, text: Array.isArray(entry) ? entry.join(ARRAY_SEPARATOR) : String(entry ?? '') }))
    .filter(({ text }) => text !== '');
};

// A reported zero is a value everywhere except in a metered column, where it means "not reported": a core
// predating a token column stores zero for a call it never metered, so stating `0` on a hop that measured
// nothing would read as broken data.
export const isSpanFieldEmpty = (value: unknown, tag: string): boolean => {
  if (value == null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return spanObjectEntries(value).length === 0;
  }

  return value === 0 && SPAN_METERED_TAGS.includes(tag);
};

export const spanFieldText = (value: unknown, type: AnalyticsFieldType, tag = ''): string => {
  if (value == null || value === '') {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(ARRAY_SEPARATOR);
  }
  if (DATE_FIELD_TYPES.includes(type)) {
    return formatDateTimeWithMillisToLocalString(value as number | string);
  }
  if (type === AnalyticsFieldType.Enum) {
    return readableWords(String(value));
  }
  // Tested on the value, not the declared type: a column typed as a scalar can still arrive as an object,
  // and `String` would make "[object Object]" of it.
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  // Cost columns are `decimal` and run to seven places below the cent: `toLocaleString` keeps three, so a
  // hop that spent $0.0000075 would state `0`, and an instance serialising the decimal as a string would
  // state twelve raw places.
  if (SPAN_COST_TAGS.includes(tag)) {
    return formatSignificantCost(value as number | string | null);
  }
  // Exact rather than compact: a group states its figure beside the parts it is made of, and `7.5 K` cannot
  // be checked against them.
  if (NUMERIC_FIELD_TYPES.includes(type) && typeof value === 'number') {
    return value.toLocaleString();
  }

  return String(value);
};

export const spanGroupSummary = (row: SpanFieldRow, group: SpanFieldGroup): string => {
  const stated = statedSpanFields(row, group);
  const [first] = stated;

  if (!first) {
    return '';
  }

  const summaryField = SPAN_GROUP_SUMMARY_FIELD[group.tag];
  if (summaryField && !isSpanFieldEmpty(row[summaryField], group.tag)) {
    // The named column need not belong to the group previewing it, so it can have no descriptor here.
    const type = group.fields.find(({ name }) => name === summaryField)?.type ?? SPAN_SUMMARY_FIELD_TYPE;

    return spanFieldText(row[summaryField], type, group.tag);
  }

  // The untagged group holds whatever the catalog did not group, so its first value stands for nothing; an
  // object-valued field has no one value to preview either.
  if (group.tag === UNTAGGED_SPAN_FIELD_TAG || spanObjectEntries(row[first.name]).length > 0) {
    return '';
  }

  return spanFieldText(row[first.name], first.type, first.tag);
};

export const statedSpanFields = (row: SpanFieldRow, { fields }: SpanFieldGroup): SpanFieldDescriptor[] =>
  fields.filter(({ name, tag }) => !isSpanFieldEmpty(row[name], tag));
