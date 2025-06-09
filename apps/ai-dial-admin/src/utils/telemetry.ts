import Big from 'big.js';
import {
  filterConditionConfig,
  filterOperatorConfig,
  filterTypeConfig,
  TELEMETRY_GRID_HEADERS_MAP,
} from '@/src/constants/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { TelemetryData, FilterData } from '@/src/models/telemetry';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { IRowNode, ValueFormatterParams } from 'ag-grid-community';
import { EChartsOption } from 'echarts-for-react/src/types';
import { lineChartDefaultOptions } from '@/src/components/Charts/LineChart/line-chart-config';
import { formatDateToLocalTime } from '@/src/utils/formatting/date';
import { formatNumberByDelimiter } from './formatting/number-formatting';

export const numberValueFormatter = (params: ValueFormatterParams) => {
  let number = '';

  try {
    number = formatNumberByDelimiter(params.data[params?.colDef?.field as string]);
  } catch (e) {
    if (e) {
      number = '';
    }
  }

  return number;
};

export const numberValueComparator = (
  a: string | number | undefined,
  b: string | number | undefined,
  _nodeA: IRowNode,
  _nodeB: IRowNode,
  isInverted: boolean,
): number => {
  const aNumber = typeof a === 'string' ? new Big(a).toNumber() : a;
  const bNumber = typeof b === 'string' ? new Big(b).toNumber() : b;
  if (aNumber === bNumber) {
    return 0;
  }

  if (aNumber === undefined) {
    return !isInverted ? 1 : -1;
  }

  if (bNumber === undefined) {
    return !isInverted ? -1 : 1;
  }

  return aNumber > bNumber ? 1 : -1;
};

export const getGridData = (data: TelemetryData): Record<string, string>[] => {
  return data.data.map((row) => {
    return (row as string[]).reduce((acc: Record<string, string>, value, index) => {
      acc[TELEMETRY_GRID_HEADERS_MAP[data.headers[index]]] = value;
      return acc;
    }, {});
  });
};

export const getSingleValueChartData = (data: TelemetryData): number => {
  const rawData = data.data;
  const arr = (Array.isArray(rawData[0]) ? rawData[0] : rawData) as string[];
  return arr.map((value) => new Big(value).toNumber()).reduce((acc, curr) => acc + curr, 0);
};

export const getFormattedDataFilters = (filters: FilterData[], entityName?: string | null) => {
  const userFilters = [];

  if (entityName) {
    const left = filterTypeConfig.find((filterType) => filterType.id === FILTER_TYPE.Entity)?.filter;
    const right = `'${entityName}'`;
    const operator = filterOperatorConfig[FILTER_OPERATOR.Equal];
    userFilters.push({ [operator]: { left: left, right: right } });
  }

  filters.forEach((filter) => {
    const left = filterTypeConfig.find((filterType) => filterType.id === filter.type)?.filter;
    const right = `'${filter.value}'`;
    const operator = filterOperatorConfig[filter.condition];

    userFilters.push({ [operator]: { left: left, right: right } });
  });

  return userFilters;
};

export const getFormattedFilters = (timePeriod: TimeRange, filters: FilterData[], entityName: string | null) => {
  return {
    $and: [...getFormattedTimeFilter(timePeriod), ...getFormattedDataFilters(filters, entityName)],
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

export const getLineChartData = (data: TelemetryData): Record<string, string>[] => {
  return data.data.map((row) => {
    return (row as string[]).reduce((acc: Record<string, string>, value, index) => {
      acc[data.headers[index]] = value;
      return acc;
    }, {});
  });
};

export const getDefaultFilterValue = (
  type: FILTER_TYPE,
  entities: DropdownItemsModel[],
  projects: DropdownItemsModel[],
): string => {
  if (entities.length && projects.length) {
    if (type === FILTER_TYPE.Entity) {
      return entities[0].id;
    } else {
      return projects[0].id;
    }
  }
  return '';
};

export function prepareChartData(data: Record<string, string>[]): EChartsOption {
  const config = { ...lineChartDefaultOptions };
  const xData = data.map((item) => formatDateToLocalTime(item.time));
  const yData = data.map((item) => item.requests);

  (config.xAxis as unknown as { data: string[] }).data = xData;
  (config.series as unknown as { data: string[] }[])[0].data = yData;

  return config;
}

export function getFilterTypeConfig(t: (key: string) => string) {
  return getTranslatedConfig(filterTypeConfig, t);
}

export function getFilterConditionConfig(t: (key: string) => string) {
  return getTranslatedConfig(filterConditionConfig, t);
}

function getTranslatedConfig<T extends { name: string }>(config: T[], t: (key: string) => string) {
  return config.map((item) => {
    return {
      ...item,
      name: t(item.name),
    };
  });
}
