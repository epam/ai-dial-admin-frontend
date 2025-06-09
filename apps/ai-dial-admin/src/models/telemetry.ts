import { FILTER_OPERATOR, FILTER_TYPE, FilterQuery } from '@/src/types/telemetry';

export interface TelemetryData {
  headers: string[];
  data: string[][] | string[];
}

export interface TelemetryQuery {
  $type: string;
  query: {
    distinct?: string;
    expressions: string[];
    from: string | Record<string, unknown>;
    groupBy?: string[];
    where?: {
      $and?: FilterQuery[];
    };
  };
}

export interface FilterData {
  type: FILTER_TYPE;
  condition: FILTER_OPERATOR;
  value: string;
}
