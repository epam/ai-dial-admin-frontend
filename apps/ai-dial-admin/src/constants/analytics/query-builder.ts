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
  CompactSelectOptionDescriptor,
  QueryBuilderWarning,
} from '@/src/models/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const toOptions = (values: string[]): SelectOption[] => values.map((value) => ({ value, label: capitalize(value) }));

// The filter operators offered for authoring, each with the keys for its full name and tooltip. The
// contains operators author case-insensitive matching (`ico`/`inc` → SQL ILIKE) and say so in their
// descriptions; the case-sensitive `co`/`nc` are excluded from authoring yet remain valid model
// values that deserialize and round-trip when present in an authored/translated query.
export const OPERATOR_OPTION_DESCRIPTORS: CompactSelectOptionDescriptor[] = [
  {
    value: QueryOperator.Eq,
    labelKey: QueryBuilderI18nKey.OperatorEq,
    descriptionKey: QueryBuilderI18nKey.OperatorEqDescription,
  },
  {
    value: QueryOperator.Ne,
    labelKey: QueryBuilderI18nKey.OperatorNe,
    descriptionKey: QueryBuilderI18nKey.OperatorNeDescription,
  },
  {
    value: QueryOperator.Ico,
    labelKey: QueryBuilderI18nKey.OperatorCo,
    descriptionKey: QueryBuilderI18nKey.OperatorCoDescription,
  },
  {
    value: QueryOperator.Inc,
    labelKey: QueryBuilderI18nKey.OperatorNc,
    descriptionKey: QueryBuilderI18nKey.OperatorNcDescription,
  },
  {
    value: QueryOperator.Lt,
    labelKey: QueryBuilderI18nKey.OperatorLt,
    descriptionKey: QueryBuilderI18nKey.OperatorLtDescription,
  },
  {
    value: QueryOperator.Gt,
    labelKey: QueryBuilderI18nKey.OperatorGt,
    descriptionKey: QueryBuilderI18nKey.OperatorGtDescription,
  },
  {
    value: QueryOperator.Le,
    labelKey: QueryBuilderI18nKey.OperatorLe,
    descriptionKey: QueryBuilderI18nKey.OperatorLeDescription,
  },
  {
    value: QueryOperator.Ge,
    labelKey: QueryBuilderI18nKey.OperatorGe,
    descriptionKey: QueryBuilderI18nKey.OperatorGeDescription,
  },
  {
    value: QueryOperator.In,
    labelKey: QueryBuilderI18nKey.OperatorIn,
    descriptionKey: QueryBuilderI18nKey.OperatorInDescription,
  },
];

export const VALUE_TYPE_OPTIONS: SelectOption[] = toOptions(
  Object.values(QueryValueType).filter((t) => t !== QueryValueType.Null),
);

export const LOGICAL_OPERATOR_OPTIONS: SelectOption[] = [
  { value: QueryLogicalOperator.And, label: 'AND' },
  { value: QueryLogicalOperator.Or, label: 'OR' },
  { value: QueryLogicalOperator.Not, label: 'NOT' },
];

export const SORT_DIRECTION_OPTION_DESCRIPTORS: CompactSelectOptionDescriptor[] = [
  {
    value: QuerySortDirection.Asc,
    labelKey: QueryBuilderI18nKey.DirectionAsc,
    descriptionKey: QueryBuilderI18nKey.DirectionAscDescription,
  },
  {
    value: QuerySortDirection.Desc,
    labelKey: QueryBuilderI18nKey.DirectionDesc,
    descriptionKey: QueryBuilderI18nKey.DirectionDescDescription,
  },
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
// Deliberately shorter than the label an authored count row derives ("Row count"): this name is only
// ever a result-grid header, never something the user typed or can edit.
export const IMPLICIT_COUNT_ALIAS = 'Count';

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
  [QueryBuilderWarning.MissingGroupByField]: QueryBuilderI18nKey.WarningMissingGroupByField,
  [QueryBuilderWarning.EmptyAggregate]: QueryBuilderI18nKey.WarningEmptyAggregate,
};

// Which section header surfaces which aggregate-validation warning.
export const GROUP_BY_SECTION_WARNINGS = [QueryBuilderWarning.EmptyAggregate, QueryBuilderWarning.MissingGroupByField];
export const AGGREGATE_SECTION_WARNINGS = [QueryBuilderWarning.EmptyAggregate];
