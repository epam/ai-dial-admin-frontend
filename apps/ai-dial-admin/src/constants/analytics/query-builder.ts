import { SelectOption } from '@epam/ai-dial-ui-kit';

import {
  QueryLogicalOperator,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueType,
} from '@/src/models/analytics/query';
import {
  ChartColumnSource,
  ChartConfig,
  ChartSlotDescriptor,
  ChartType,
  QueryBuilderWarning,
} from '@/src/models/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const toOptions = (values: string[]): SelectOption[] => values.map((value) => ({ value, label: capitalize(value) }));

// Filter operators offered for authoring. The contains operators author case-insensitive matching
// (`ico`/`inc`, → SQL ILIKE) but are shown with the familiar short CO/NC codes; the case-sensitive
// `co`/`nc` are excluded from authoring yet remain valid model values that deserialize and round-trip
// when present in an authored/translated query.
export const FILTER_OPERATORS: QueryOperator[] = [
  QueryOperator.Eq,
  QueryOperator.Ne,
  QueryOperator.Ico,
  QueryOperator.Inc,
  QueryOperator.Lt,
  QueryOperator.Gt,
  QueryOperator.Le,
  QueryOperator.Ge,
  QueryOperator.In,
];

// Short display labels for the case-insensitive contains operators — the familiar CO/NC codes.
// Every other operator shows its uppercased code.
const OPERATOR_LABEL_OVERRIDE: Partial<Record<QueryOperator, string>> = {
  [QueryOperator.Ico]: 'CO',
  [QueryOperator.Inc]: 'NC',
};

export const OPERATOR_OPTIONS: SelectOption[] = FILTER_OPERATORS.map((op) => ({
  value: op,
  label: OPERATOR_LABEL_OVERRIDE[op] ?? op.toUpperCase(),
}));

export const VALUE_TYPE_OPTIONS: SelectOption[] = toOptions(
  Object.values(QueryValueType).filter((t) => t !== QueryValueType.Null),
);

export const LOGICAL_OPERATOR_OPTIONS: SelectOption[] = [
  { value: QueryLogicalOperator.And, label: 'AND' },
  { value: QueryLogicalOperator.Or, label: 'OR' },
  { value: QueryLogicalOperator.Not, label: 'NOT' },
];

export const SORT_DIRECTION_OPTIONS: SelectOption[] = [
  { value: QuerySortDirection.Asc, label: 'ASC' },
  { value: QuerySortDirection.Desc, label: 'DESC' },
];

export const SORT_NULLS_DEFAULT = QuerySortNulls.Default;
export const SORT_NULLS_OPTIONS: SelectOption[] = [
  { value: QuerySortNulls.Default, label: 'Default' },
  { value: QuerySortNulls.First, label: 'First' },
  { value: QuerySortNulls.Last, label: 'Last' },
];

export const PAGE_TYPE_OPTIONS: SelectOption[] = [
  { value: QueryPageType.Offset, label: 'Offset' },
  { value: QueryPageType.Cursor, label: 'Cursor' },
];

export const DEFAULT_PAGE_LIMIT = 25;
export const DEFAULT_CURSOR_LIMIT = 100;

export const UNTAGGED_KEY = 'untagged';

// Alias of the count() column added to aggregate queries that define no aggregates of their own.
export const IMPLICIT_COUNT_ALIAS = 'count';

export const LOCAL_STORAGE_QUERY_BUILDER_RAIL_KEY = 'query-builder-rail-collapsed';

export const QUERY_BUILDER_RAIL_WIDTH_CLASS = 'w-[480px]';

export const CHART_TYPE_OPTIONS: SelectOption[] = toOptions(Object.values(ChartType));

export const DEFAULT_CHART_CONFIG: ChartConfig = { type: ChartType.Bar, xField: null, yField: null };

// Pie shows at most this many slices; the remaining categories merge into one "Other" slice.
export const PIE_MAX_SLICES = 10;

const AXIS_SLOTS = {
  xLabelKey: QueryBuilderI18nKey.ChartXAxis,
  yLabelKey: QueryBuilderI18nKey.ChartYAxis,
};

export const CHART_SLOT_DESCRIPTORS: Record<ChartType, ChartSlotDescriptor> = {
  [ChartType.Bar]: { xSource: ChartColumnSource.Dimensions, ySource: ChartColumnSource.Aggregates, ...AXIS_SLOTS },
  [ChartType.Line]: { xSource: ChartColumnSource.Dimensions, ySource: ChartColumnSource.Aggregates, ...AXIS_SLOTS },
  [ChartType.Pie]: {
    xSource: ChartColumnSource.Dimensions,
    ySource: ChartColumnSource.Aggregates,
    xLabelKey: QueryBuilderI18nKey.ChartCategory,
    yLabelKey: QueryBuilderI18nKey.ChartValue,
  },
  [ChartType.Scatter]: { xSource: ChartColumnSource.Numeric, ySource: ChartColumnSource.Numeric, ...AXIS_SLOTS },
};

export const WARNING_I18N: Record<QueryBuilderWarning, QueryBuilderI18nKey> = {
  [QueryBuilderWarning.MissingAggregateAlias]: QueryBuilderI18nKey.WarningMissingAggregateAlias,
  [QueryBuilderWarning.MissingGroupByField]: QueryBuilderI18nKey.WarningMissingGroupByField,
  [QueryBuilderWarning.MissingGroupByAlias]: QueryBuilderI18nKey.WarningMissingGroupByAlias,
  [QueryBuilderWarning.EmptyAggregate]: QueryBuilderI18nKey.WarningEmptyAggregate,
};

// Which section header surfaces which aggregate-validation warning.
export const GROUP_BY_SECTION_WARNINGS = [
  QueryBuilderWarning.EmptyAggregate,
  QueryBuilderWarning.MissingGroupByField,
  QueryBuilderWarning.MissingGroupByAlias,
];
export const AGGREGATE_SECTION_WARNINGS = [
  QueryBuilderWarning.MissingAggregateAlias,
  QueryBuilderWarning.EmptyAggregate,
];
