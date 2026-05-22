import { SelectOption } from '@epam/ai-dial-ui-kit';
import { SortModelItem } from 'ag-grid-community';
import { Big } from 'big.js';
import { EChartsOption } from 'echarts-for-react/src/types';

import {
  lineChartDefaultOptions,
  multiSeriesLineChartOptions,
} from '@/src/components/Telemetry/Dashboards/LineChart/constants';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import {
  TELEMETRY_DATASET_NAME,
  TELEMETRY_GRID_HEADERS_MAP,
  USAGE_LOG_COLUMN_ID_TO_SOURCE,
  USAGE_LOG_DEFAULT_ORDER_BY,
  USAGE_LOG_TEXT_OPERATOR_MAP,
} from '@/src/constants/telemetry';
import {
  filterConditionConfig,
  filterOperatorConfig,
  filterTypeConfig,
  mcpFilterTypeConfig,
  routerFilterTypeConfig,
} from '@/src/constants/telemetry/filters';
import { USAGE_LOG_NUMERIC_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ServerActionResponse } from '@/src/models/server-action';
import {
  AgGridTextFilter,
  BuildUsageLogQueryParams,
  DatasetMetadata,
  FilterData,
  TelemetryData,
  TelemetryQuery,
  UsageLogFilterClause,
  UsageLogFilterModel,
} from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';

export const getGridData = (data: TelemetryData): Record<string, string>[] => {
  return (
    data.data?.map((row) => {
      return (row as string[]).reduce((acc: Record<string, string>, value, index) => {
        acc[TELEMETRY_GRID_HEADERS_MAP[data.headers[index]]] = value;
        return acc;
      }, {});
    }) || []
  );
};

export const getSingleValueChartData = (data: TelemetryData): number => {
  const rawData = data.data;
  if (!rawData) {
    return 0;
  }
  const arr = (Array.isArray(rawData[0]) ? rawData[0] : rawData) as string[];
  return arr.map((value) => new Big(value).toNumber()).reduce((acc, curr) => acc + curr, 0);
};

export const getFormattedDataFilters = (filters: FilterData[], entityName?: string | null) => {
  const userFilters = [];

  const filtersConfig = [...filterTypeConfig, ...mcpFilterTypeConfig, ...routerFilterTypeConfig];
  if (entityName) {
    const left = filtersConfig.find((filterType) => filterType.value === FILTER_TYPE.Entity)?.filter;
    const right = `'${entityName}'`;
    const operator = filterOperatorConfig[FILTER_OPERATOR.Equal];
    userFilters.push({ [operator]: { left: left, right: right } });
  }

  filters.forEach((filter) => {
    const left = filtersConfig.find((filterType) => filterType.value === filter.type)?.filter;
    const isExactMatch = filter.condition === FILTER_OPERATOR.Equal || filter.condition === FILTER_OPERATOR.NotEqual;

    // Handle multi-value filters with $in/$nin operators
    if (isExactMatch && filter.value.length > 1) {
      const operator = filter.condition === FILTER_OPERATOR.Equal ? '$in' : '$nin';
      userFilters.push({ [operator]: { left: left, right: filter.value.map((v) => `'${v}'`) } });
    } else {
      // Single value or text input conditions
      const singleValue = filter.value[0] || '';
      const value = isExactMatch ? singleValue : singleValue.toLowerCase();
      const right = `'${value}'`;
      const operator = filterOperatorConfig[filter.condition];

      userFilters.push({ [operator]: { left: left, right: right } });
    }
  });

  return userFilters;
};

export const getFormattedFilters = (
  timePeriod: TimeRange,
  filters: FilterData[],
  entityName: string | null,
  extraConditions?: Record<string, unknown>[],
) => {
  return {
    $and: [
      ...getFormattedTimeFilter(timePeriod),
      ...getFormattedDataFilters(filters, entityName),
      ...(extraConditions || []),
    ],
  };
};

const getFormattedTimeFilter = (timePeriod: TimeRange) => {
  return [
    {
      $gte: {
        left: '_time',
        right: `'${timePeriod.startDate.toISOString()}'`,
      },
    },
    {
      $lt: {
        left: '_time',
        right: `'${timePeriod.endDate.toISOString()}'`,
      },
    },
  ];
};

export const getListingData = (data: TelemetryData): Record<string, string>[] => {
  return (
    data.data?.map((row) => {
      return (row as string[]).reduce((acc: Record<string, string>, value, index) => {
        acc[data.headers[index]] = value === 'undefined' ? '' : value;
        return acc;
      }, {});
    }) || []
  );
};

export const isDeploymentFilter = (type: FILTER_TYPE): boolean => {
  return type === FILTER_TYPE.Entity || type === FILTER_TYPE.Mcp;
};

export const getDefaultFilterValue = (
  type: FILTER_TYPE,
  entities: SelectOption[],
  projects: SelectOption[],
): string[] => {
  if (entities.length && projects.length) {
    if (type === FILTER_TYPE.Entity) {
      return [entities[0].value];
    } else {
      return [projects[0].value];
    }
  }
  return [];
};

export function prepareChartData(data: Record<string, string>[], t: (key: string) => string): EChartsOption {
  const config = { ...lineChartDefaultOptions(t) };
  const xData = data.map((item) => item.time || item.window);
  const yData = data.map((item) => item.requests || item.count);

  (config.xAxis as unknown as { data: string[] }).data = xData;
  (config.series as unknown as { data: string[] }[])[0].data = yData;

  return config;
}

export function prepareMultiSeriesChartData(data: Record<string, string>[], t: (key: string) => string): EChartsOption {
  const config = { ...multiSeriesLineChartOptions(t) };

  const timeSet = new Set<string>();
  const methodSet = new Set<string>();

  const unknownLabel = t(TelemetryI18nKey.Unknown);

  for (const row of data) {
    timeSet.add(row.window);
    methodSet.add(row.mcp_method || unknownLabel);
  }

  const times = Array.from(timeSet).sort();
  const methods = Array.from(methodSet).sort();

  const dataByMethod = new Map<string, Map<string, number>>();
  for (const method of methods) {
    dataByMethod.set(method, new Map());
  }
  for (const row of data) {
    dataByMethod.get(row.mcp_method || unknownLabel)!.set(row.window, Number(row.count));
  }

  (config.xAxis as unknown as { data: string[] }).data = times;
  (config as unknown as { series: unknown[] }).series = methods.map((method) => {
    const methodData = dataByMethod.get(method)!;
    return {
      name: method,
      type: 'line',
      smooth: true,
      data: times.map((time) => methodData.get(time) ?? 0),
    };
  });

  return config;
}

export function getFilterTypeConfig(
  t: (key: string) => string,
  isMcpView = false,
  isRouteView = false,
): SelectOption[] {
  const config = isMcpView ? mcpFilterTypeConfig : isRouteView ? routerFilterTypeConfig : filterTypeConfig;
  return getTranslatedConfig(config, t);
}

export function getFilterConditionConfig(t: (key: string) => string) {
  return getTranslatedConfig(filterConditionConfig, t);
}

function getTranslatedConfig<T extends { value: string }>(config: T[], t: (key: string) => string): SelectOption[] {
  return config.map((item) => {
    return {
      ...item,
      label: t(item.value),
    };
  });
}

export function extractTelemetryMaxRangeMs(res: ServerActionResponse): number | undefined {
  if (!res.success || !Array.isArray(res.response)) return undefined;
  const dataset = (res.response as DatasetMetadata[]).find((d) => d.name === TELEMETRY_DATASET_NAME);
  return dataset?.maxTimeRangeMs ?? undefined;
}

const toUsageLogSourceColumn = (colId: string): string => USAGE_LOG_COLUMN_ID_TO_SOURCE[colId] ?? colId;

const translateUsageLogTextFilter = (colId: string, filter: AgGridTextFilter): UsageLogFilterClause | null => {
  const operator = filter.type ? USAGE_LOG_TEXT_OPERATOR_MAP[filter.type] : undefined;
  if (!operator || filter.filter == null || filter.filter === '') {
    return null;
  }
  const column = toUsageLogSourceColumn(colId);
  if (USAGE_LOG_NUMERIC_COLUMNS.has(column)) {
    const asNumber = Number(filter.filter.toString().replace(/,/g, ''));
    if (Number.isNaN(asNumber)) {
      return null;
    }
    return { [operator]: { left: column, right: asNumber } };
  }
  return { [operator]: { left: column, right: `'${filter.filter}'` } };
};

export const translateUsageLogFilterModel = (
  filterModel: UsageLogFilterModel | null | undefined,
): UsageLogFilterClause[] => {
  if (!filterModel) {
    return [];
  }
  return Object.entries(filterModel).flatMap(([colId, filter]) => {
    const clause = translateUsageLogTextFilter(colId, filter);
    return clause == null ? [] : [clause];
  });
};

export const translateUsageLogSortModel = (sortModel: SortModelItem[]): Record<string, string>[] => {
  const [first] = sortModel;
  if (!first) {
    return USAGE_LOG_DEFAULT_ORDER_BY;
  }
  return [{ [first.sort === 'desc' ? '$desc' : '$asc']: toUsageLogSourceColumn(first.colId) }];
};

export const buildUsageLogQuery = ({
  baseQuery,
  offset,
  sortModel,
  filterModel,
  timeRange,
  entityName,
}: BuildUsageLogQueryParams): TelemetryQuery => {
  const baseFilters = getFormattedFilters(timeRange, [], entityName);
  const gridFilters = translateUsageLogFilterModel(filterModel);

  return {
    ...baseQuery,
    query: {
      ...baseQuery.query,
      where: {
        $and: [...(baseFilters.$and ?? []), ...gridFilters],
      },
      orderBy: translateUsageLogSortModel(sortModel),
      ...(offset > 0 ? { offset } : {}),
    },
  };
};
