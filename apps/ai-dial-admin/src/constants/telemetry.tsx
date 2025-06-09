import Contains from '@/public/images/icons/filter/contains.svg';
import EndsWith from '@/public/images/icons/filter/ends-with.svg';
import NotContains from '@/public/images/icons/filter/not-contains.svg';
import StartsWith from '@/public/images/icons/filter/starts-with.svg';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { TelemetryQuery } from '@/src/models/telemetry';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { numberValueComparator, numberValueFormatter } from '@/src/utils/telemetry';
import { IconEqual, IconEqualNot } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import { BASE_ICON_PROPS } from './main-layout';

export const TELEMETRY_GRID_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Deployment ID' },
  {
    field: 'requests',
    headerName: 'Request Count',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'prompts',
    headerName: 'Prompt Tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'completions',
    headerName: 'Completion tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'cost',
    headerName: 'Money',
    sort: 'desc',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
];

export const PROJECT_GRID_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Project' },
  {
    field: 'requests',
    headerName: 'Request Count',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'prompts',
    headerName: 'Prompt Tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'completions',
    headerName: 'Completion tokens',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
  {
    field: 'cost',
    headerName: 'Money',
    sort: 'desc',
    cellClass: 'align-right',
    comparator: numberValueComparator,
    valueFormatter: (params) => numberValueFormatter(params),
  },
];

export const DEFAULT_REFRESH_TIME = '1m';

export const filterOperatorConfig: Record<string, string> = {
  [FILTER_OPERATOR.Contain]: '$contains',
  [FILTER_OPERATOR.NotContains]: '$not_contains',
  [FILTER_OPERATOR.Equal]: '$eq',
  [FILTER_OPERATOR.NotEqual]: '$ne',
  [FILTER_OPERATOR.StartsWith]: '$starts_with',
  [FILTER_OPERATOR.EndsWith]: '$ends_with',
};

export const filterTypeConfig = [
  { id: FILTER_TYPE.Entity, name: TelemetryI18nKey.FilterTypeEntities, filter: 'deployment' },
  { id: FILTER_TYPE.Project, name: TelemetryI18nKey.FilterTypeProjects, filter: 'project_id' },
];

export const filterConditionConfig = [
  { id: FILTER_OPERATOR.Contain, name: TelemetryI18nKey.FilterConditionContain, icon: <Contains /> },
  { id: FILTER_OPERATOR.NotContains, name: TelemetryI18nKey.FilterConditionNotContain, icon: <NotContains /> },
  { id: FILTER_OPERATOR.Equal, name: TelemetryI18nKey.FilterConditionEqual, icon: <IconEqual {...BASE_ICON_PROPS} /> },
  {
    id: FILTER_OPERATOR.NotEqual,
    name: TelemetryI18nKey.FilterConditionNotEqual,
    icon: <IconEqualNot {...BASE_ICON_PROPS} />,
  },
  { id: FILTER_OPERATOR.StartsWith, name: TelemetryI18nKey.FilterConditionStartsWith, icon: <StartsWith /> },
  { id: FILTER_OPERATOR.EndsWith, name: TelemetryI18nKey.FilterConditionEndsWith, icon: <EndsWith /> },
];

export const refreshOptionsConfig = [
  { id: 'off', name: 'Off', timeout: null },
  { id: '30s', name: '30 sec', timeout: 30 * 1000 },
  { id: '1m', name: '1 min', timeout: 60 * 1000 },
  { id: '5m', name: '5 min', timeout: 5 * 60 * 1000 },
  { id: '15m', name: '15 min', timeout: 15 * 60 * 1000 },
  { id: '30m', name: '30 min', timeout: 30 * 60 * 1000 },
  { id: '1h', name: '1 h', timeout: 60 * 60 * 1000 },
  { id: '2h', name: '2 h', timeout: 2 * 60 * 60 * 1000 },
  { id: '1d', name: '1 d', timeout: 24 * 60 * 60 * 1000 },
];

export const UNIQ_USERS_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['count()'],
    from: {
      distinct: 'true',
      expressions: ['user_hash'],
      from: 'analytics',
    },
  },
};

export const REQUEST_COUNT_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['count()'],
    from: 'analytics',
  },
};

export const TOTAL_TOKENS_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['sum(prompt_tokens)', 'sum(completion_tokens)'],
    from: 'analytics',
  },
};

export const MONEY_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['sum(deployment_price)'],
    from: 'analytics',
  },
};

export const ENTITY_CONSUMPTION_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      'deployment',
      'count()',
      'sum(price) as money',
      'sum(prompt_tokens) as tokens_p',
      'sum(completion_tokens) as tokens_c',
    ],
    from: 'analytics',
    groupBy: ['deployment'],
  },
};

export const ENTITY_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    distinct: 'true',
    expressions: ['deployment'],
    from: 'analytics',
  },
};

export const PROJECT_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    distinct: 'true',
    expressions: ['project_id'],
    from: 'analytics',
  },
};

export const PROJECT_CONSUMPTION_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      'project_id',
      'count()',
      'sum(price) as money',
      'sum(prompt_tokens) as tokens_p',
      'sum(completion_tokens) as tokens_c',
    ],
    from: 'analytics',
    groupBy: ['project_id'],
  },
};

export const SYSTEM_USAGE_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ["window(_time, 1, 'm') as time", 'count() as requests'],
    from: 'analytics',
    groupBy: ["window(_time, 1, 'm')"],
  },
};

export const TELEMETRY_GRID_HEADERS_MAP: Record<string, string> = {
  deployment: 'name',
  project_id: 'name',
  count: 'requests',
  money: 'cost',
  tokens_p: 'prompts',
  tokens_c: 'completions',
};
