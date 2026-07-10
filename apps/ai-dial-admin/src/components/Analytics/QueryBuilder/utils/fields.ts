import { UNTAGGED_KEY } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { FieldOption, QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryMode, QueryValueType } from '@/src/models/analytics/query';

export const family = (name: string): string => {
  const i = name.indexOf(':');
  return i === -1 ? 'column' : name.slice(0, i);
};

export const typeOf = (fields: AnalyticsEntityField[], name: string): string | undefined =>
  fields.find((f) => f.name === name)?.type;

export const defaultValueType = (fieldType?: string): QueryValueType => {
  switch (fieldType) {
    case AnalyticsFieldType.Uuid:
      return QueryValueType.Uuid;
    case AnalyticsFieldType.Integer:
      return QueryValueType.Integer;
    case AnalyticsFieldType.Long:
      return QueryValueType.Long;
    case AnalyticsFieldType.Decimal:
      return QueryValueType.Decimal;
    case AnalyticsFieldType.Boolean:
      return QueryValueType.Boolean;
    case AnalyticsFieldType.Date:
      return QueryValueType.Date;
    case AnalyticsFieldType.Timestamp:
      return QueryValueType.Timestamp;
    default:
      return QueryValueType.String;
  }
};

export const sortByName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

export const tagOf = (field: AnalyticsEntityField): string => field.tag || UNTAGGED_KEY;

export const distinctTags = (fields: AnalyticsEntityField[]): string[] => {
  const seen = new Set<string>();
  const tags: string[] = [];
  fields.forEach((f) => {
    const tag = tagOf(f);
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  });
  return tags;
};

export const filterFieldsByTags = (fields: AnalyticsEntityField[], selectedTags: string[]): AnalyticsEntityField[] => {
  if (!selectedTags.length) return fields;
  const selected = new Set(selectedTags);
  return fields.filter((f) => selected.has(tagOf(f)));
};

export const bucketFieldOptions = (fields: AnalyticsEntityField[]): AnalyticsEntityField[] => {
  const temporal = fields.filter((f) => f.type === AnalyticsFieldType.Timestamp || f.type === AnalyticsFieldType.Date);
  return sortByName(temporal.length ? temporal : fields);
};

export const havingFieldOptions = (state: QueryBuilderState): FieldOption[] => {
  const groupBy = state.groupBy.map((name) => ({ name, type: typeOf(state.fields, name) }));
  const bucketAliases = state.buckets
    .filter((b) => b.alias)
    .map((b) => ({ name: b.alias, type: AnalyticsFieldType.Timestamp }));
  const aggAliases = state.aggregates
    .filter((a) => a.alias)
    .map((a) => ({ name: a.alias, type: AnalyticsFieldType.Decimal }));
  return sortByName([...groupBy, ...bucketAliases, ...aggAliases]);
};

export const sortFieldOptions = (state: QueryBuilderState): FieldOption[] => {
  if (state.mode === QueryMode.Row) return sortByName(state.fields.map((f) => ({ name: f.name, type: f.type })));
  return havingFieldOptions(state);
};
