import { SelectOption } from '@epam/ai-dial-ui-kit';
import { Big } from 'big.js';
import { EChartsOption } from 'echarts-for-react/src/types';

import { lineChartDefaultOptions, multiSeriesLineChartOptions } from '@/src/components/Charts/LineChart/constants';
import {
  filterConditionConfig,
  filterOperatorConfig,
  filterTypeConfig,
  TELEMETRY_GRID_HEADERS_MAP,
} from '@/src/constants/telemetry';
import { FilterData, TelemetryData } from '@/src/models/telemetry';
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

  if (entityName) {
    const left = filterTypeConfig.find((filterType) => filterType.value === FILTER_TYPE.Entity)?.filter;
    const right = `'${entityName}'`;
    const operator = filterOperatorConfig[FILTER_OPERATOR.Equal];
    userFilters.push({ [operator]: { left: left, right: right } });
  }

  filters.forEach((filter) => {
    const left = filterTypeConfig.find((filterType) => filterType.value === filter.type)?.filter;
    const isExactMatch = filter.condition === FILTER_OPERATOR.Equal || filter.condition === FILTER_OPERATOR.NotEqual;
    const value = isExactMatch ? filter.value : filter.value.toLowerCase();
    const right = `'${value}'`;
    const operator = filterOperatorConfig[filter.condition];

    userFilters.push({ [operator]: { left: left, right: right } });
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

export const getDefaultFilterValue = (
  type: FILTER_TYPE,
  entities: SelectOption[],
  projects: SelectOption[],
): string => {
  if (entities.length && projects.length) {
    if (type === FILTER_TYPE.Entity) {
      return entities[0].value;
    } else {
      return projects[0].value;
    }
  }
  return '';
};

export function prepareChartData(data: Record<string, string>[], t: (key: string) => string): EChartsOption {
  const config = { ...lineChartDefaultOptions(t) };
  const xData = data.map((item) => item.time);
  const yData = data.map((item) => item.requests);

  (config.xAxis as unknown as { data: string[] }).data = xData;
  (config.series as unknown as { data: string[] }[])[0].data = yData;

  return config;
}

export function prepareMultiSeriesChartData(data: Record<string, string>[], t: (key: string) => string): EChartsOption {
  const config = { ...multiSeriesLineChartOptions(t) };

  const timeSet = new Set<string>();
  const methodSet = new Set<string>();

  for (const row of data) {
    timeSet.add(row.window);
    methodSet.add(row.mcp_method);
  }

  const times = Array.from(timeSet).sort();
  const methods = Array.from(methodSet).sort();

  const dataByMethod = new Map<string, Map<string, number>>();
  for (const method of methods) {
    dataByMethod.set(method, new Map());
  }
  for (const row of data) {
    dataByMethod.get(row.mcp_method)!.set(row.window, Number(row.count));
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

export function getFilterTypeConfig(t: (key: string) => string): SelectOption[] {
  return getTranslatedConfig(filterTypeConfig, t);
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
