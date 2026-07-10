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
} from '@/src/models/analytics/query';

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
}

export interface SchemaPreviewRow {
  field: string;
  type: string;
  family: string;
  source: string;
  tag: string;
}

export enum QueryBuilderView {
  Form = 'form',
  Json = 'json',
}

export enum QueryBuilderWarning {
  MissingAggregateAlias = 'MissingAggregateAlias',
  MissingBucketField = 'MissingBucketField',
  MissingBucketAlias = 'MissingBucketAlias',
  EmptyAggregate = 'EmptyAggregate',
}
