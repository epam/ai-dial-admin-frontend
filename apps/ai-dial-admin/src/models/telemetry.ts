import { SortModelItem } from 'ag-grid-community';

import { TimeRange } from '@/src/models/time-range';
import { FILTER_OPERATOR, FILTER_TYPE, FilterQuery } from '@/src/types/telemetry';

export interface TelemetryData {
  headers: string[];
  data?: string[][] | string[];
}

export interface EntityRow {
  name?: string;
  parent_deployment?: string;
  execution_path?: string;
  requests?: string;
  cost?: string;
  deployment_cost?: string;
  prompts?: string;
  completions?: string;
  synthetic?: boolean;
}

export interface RawConsumptionRow {
  deployment: string;
  parent_deployment: string;
  execution_path: string;
  project_id: string;
  count: string;
  money: string;
  aggregated_money: string;
  tokens_p: string;
  tokens_c: string;
}

export interface TelemetryQuery {
  $type: string;
  fillGaps?: boolean;
  query: {
    distinct?: string;
    expressions: string[];
    from: string | Record<string, unknown>;
    groupBy?: string[];
    where?: {
      $and?: FilterQuery[];
    };
    orderBy?: Record<string, string>[];
    limit?: number;
    offset?: number;
  };
}

export interface AgGridTextFilter {
  filterType: 'text';
  type?: string;
  filter?: string;
}

export interface AgGridNumberFilter {
  filterType: 'number';
  type?: string;
  filter?: number;
  filterTo?: number;
}

export type AgGridFilter = AgGridTextFilter | AgGridNumberFilter;
export type UsageLogFilterModel = Record<string, AgGridFilter>;

export type UsageLogFilterClauseValue = { left: string; right: string | number };
export type UsageLogFilterClause = {
  [op: string]: UsageLogFilterClauseValue | UsageLogFilterClause[];
};

export interface BuildUsageLogQueryParams {
  baseQuery: TelemetryQuery;
  offset: number;
  sortModel: SortModelItem[];
  filterModel: UsageLogFilterModel | null | undefined;
  timeRange: TimeRange;
  entityName: string | null;
}

export interface FilterData {
  type: FILTER_TYPE;
  condition: FILTER_OPERATOR;
  value: string[];
}

export interface DatasetMetadata {
  name: string;
  maxTimeRangeMs: number;
}
