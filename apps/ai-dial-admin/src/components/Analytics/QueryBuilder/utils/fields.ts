import { UNTAGGED_KEY } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { FieldOption, FieldOptionGroup, GroupByRow, QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryMode, QueryValueType } from '@/src/models/analytics/query';
import { functionByName, functionResultType } from '@/src/components/Analytics/QueryBuilder/utils/functions';

export const family = (name: string): string => {
  const i = name.indexOf(':');
  return i === -1 ? 'column' : name.slice(0, i);
};

export const typeOf = (fields: AnalyticsEntityField[], name: string): string | undefined =>
  fields.find((f) => f.name === name)?.type;

export const fieldDisplayName = (fields: Pick<AnalyticsEntityField, 'name' | 'display_name'>[], name: string): string =>
  fields.find((f) => f.name === name)?.display_name || name;

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

// Groups options by tag for the categorized dropdown, preserving first-seen tag order. Untagged
// options land in a group keyed UNTAGGED_KEY; a search term filters by name, display name, and tag
// beforehand.
export const groupFieldOptions = (options: FieldOption[], search = ''): FieldOptionGroup[] => {
  const term = search.trim().toLowerCase();
  const visible = term
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(term) ||
          (o.display_name || '').toLowerCase().includes(term) ||
          (o.tag || '').toLowerCase().includes(term),
      )
    : options;
  const groups = new Map<string, FieldOption[]>();
  visible.forEach((o) => {
    const tag = o.tag || UNTAGGED_KEY;
    const bucket = groups.get(tag);
    if (bucket) bucket.push(o);
    else groups.set(tag, [o]);
  });
  return [...groups.entries()].map(([tag, opts]) => ({ tag, options: sortByName(opts) }));
};

export const fieldsToOptions = (fields: AnalyticsEntityField[]): FieldOption[] =>
  fields.map((f) => ({
    name: f.name,
    type: f.type,
    tag: f.tag,
    display_name: f.display_name,
    description: f.description,
    sensitive: f.sensitive,
  }));

const groupByOption = (state: QueryBuilderState, row: GroupByRow): FieldOption | null => {
  if (!row.fn) {
    if (!row.field) return null;
    // Plain group-by columns keep their schema display name/description so the Having/Sort pickers
    // can display them; function rows are alias-only and carry neither.
    const field = state.fields.find((f) => f.name === row.field);
    return { name: row.field, type: field?.type, display_name: field?.display_name, description: field?.description };
  }
  const fn = functionByName(state.functions, row.fn);
  return row.alias && fn ? { name: row.alias, type: functionResultType(fn, row.args, state.fields) } : null;
};

export const havingFieldOptions = (state: QueryBuilderState): FieldOption[] => {
  const groupBy = state.groupBy.map((g) => groupByOption(state, g)).filter((o): o is FieldOption => o !== null);
  const aggAliases = state.aggregates
    .filter((a) => a.alias)
    .map((a) => ({ name: a.alias, type: AnalyticsFieldType.Decimal }));
  return sortByName([...groupBy, ...aggAliases]);
};

export const sortFieldOptions = (state: QueryBuilderState): FieldOption[] => {
  // Keep tags so the categorized dropdown can group; aggregate-mode options are aliases (untagged).
  if (state.mode === QueryMode.Row) return sortByName(fieldsToOptions(state.fields));
  return havingFieldOptions(state);
};
