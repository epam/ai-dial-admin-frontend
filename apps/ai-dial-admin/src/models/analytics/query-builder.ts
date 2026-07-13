import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import {
  QueryAggregateFn,
  QueryBucketUnit,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';

// The toolbar time filter serializes into the structured query as ge/le predicates on this field —
// resolved once per build so the JSON view, Copy, and Run all carry the same visible time bound.
export interface QueryTimeBound {
  field: string;
  range: TimeRange;
}

export enum FilterNodeKind {
  Group = 'group',
  Predicate = 'predicate',
}

export interface FilterPredicateNode {
  id: string;
  kind: FilterNodeKind.Predicate;
  field: string;
  op: QueryOperator;
  valueType: QueryValueType;
  value: string;
  isNull: boolean;
}

export interface FilterGroupNode {
  id: string;
  kind: FilterNodeKind.Group;
  op: QueryLogicalOperator;
  children: FilterNode[];
}

export type FilterNode = FilterGroupNode | FilterPredicateNode;

export interface BucketRow {
  id: string;
  amount: number;
  unit: QueryBucketUnit;
  field: string;
  alias: string;
}

export interface AggregateRow {
  id: string;
  fn: QueryAggregateFn;
  field: string;
  distinct: boolean;
  alias: string;
}

export interface SortRow {
  id: string;
  field: string;
  dir: QuerySortDirection;
  nulls: QuerySortNulls;
}

export interface PageState {
  enabled: boolean;
  type: QueryPageType;
  offset: number;
  limit: number;
  includeTotal: boolean;
  cursor: string;
  cursorLimit: number;
}

export interface QueryBuilderState {
  entityName: string;
  fields: AnalyticsEntityField[];
  mode: QueryMode;
  distinct: boolean;
  filter: FilterGroupNode;
  select: string[];
  groupBy: string[];
  buckets: BucketRow[];
  aggregates: AggregateRow[];
  having: FilterGroupNode;
  sort: SortRow[];
  page: PageState;
}

export interface FieldOption {
  name: string;
  type?: string;
  tag?: string;
}

export interface FieldOptionGroup {
  tag: string;
  options: FieldOption[];
}

// The builder's own color language, mirroring how the same query reads in the Monaco JSON view:
// fields/keys are teal, values blue, grouping brackets purple, keywords yellow, numbers orange.
export enum QueryBuilderColor {
  Dimension = 'dimension',
  Measure = 'measure',
  Grouping = 'grouping',
  Constraint = 'constraint',
  Keyword = 'keyword',
  Numeric = 'numeric',
}

export interface QueryBuilderColorClasses {
  marker: string;
  text: string;
  chipBg: string;
  chipText: string;
  borderAccent: string;
}

export enum QueryBuilderView {
  Form = 'form',
  Json = 'json',
  Sql = 'sql',
}

// A query run request. Structured (Form/JSON views) posts a StructuredQuery to /execute; SQL posts
// the editor text to /execute-sql. Discriminated so the result sidebar can branch the transport
// while sharing all result rendering.
export enum QueryRequestKind {
  Structured = 'structured',
  Sql = 'sql',
}

export type QueryRunRequest =
  | { kind: QueryRequestKind.Structured; query: StructuredQuery }
  | { kind: QueryRequestKind.Sql; sql: string };

export enum QueryBuilderWarning {
  MissingAggregateAlias = 'MissingAggregateAlias',
  MissingBucketField = 'MissingBucketField',
  MissingBucketAlias = 'MissingBucketAlias',
  EmptyAggregate = 'EmptyAggregate',
}
