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

export type UsageLogFilterModel = Record<string, AgGridTextFilter>;
export type UsageLogFilterClause = Record<string, { left: string; right: string | number }>;

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
