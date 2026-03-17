import Contains from '@/public/images/icons/filter/contains.svg';
import EndsWith from '@/public/images/icons/filter/ends-with.svg';
import NotContains from '@/public/images/icons/filter/not-contains.svg';
import StartsWith from '@/public/images/icons/filter/starts-with.svg';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { TelemetryQuery } from '@/src/models/telemetry';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { IconEqual, IconEqualNot } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from './main-layout';

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
  { value: FILTER_TYPE.Entity, label: TelemetryI18nKey.FilterTypeEntities, filter: 'deployment' },
  { value: FILTER_TYPE.Project, label: TelemetryI18nKey.FilterTypeProjects, filter: 'project_id' },
];

export const filterConditionConfig = [
  { value: FILTER_OPERATOR.Contain, label: TelemetryI18nKey.FilterConditionContain, icon: <Contains /> },
  { value: FILTER_OPERATOR.NotContains, label: TelemetryI18nKey.FilterConditionNotContain, icon: <NotContains /> },
  {
    value: FILTER_OPERATOR.Equal,
    label: TelemetryI18nKey.FilterConditionEqual,
    icon: <IconEqual {...BASE_BUTTON_ICON_PROPS} />,
  },
  {
    value: FILTER_OPERATOR.NotEqual,
    label: TelemetryI18nKey.FilterConditionNotEqual,
    icon: <IconEqualNot {...BASE_BUTTON_ICON_PROPS} />,
  },
  { value: FILTER_OPERATOR.StartsWith, label: TelemetryI18nKey.FilterConditionStartsWith, icon: <StartsWith /> },
  { value: FILTER_OPERATOR.EndsWith, label: TelemetryI18nKey.FilterConditionEndsWith, icon: <EndsWith /> },
];

export const refreshOptionsConfig = [
  { value: 'off', label: 'Off', timeout: null },
  { value: '30s', label: '30s', timeout: 30 * 1000 },
  { value: '1m', label: '1m', timeout: 60 * 1000 },
  { value: '5m', label: '5m', timeout: 5 * 60 * 1000 },
  { value: '15m', label: '15m', timeout: 15 * 60 * 1000 },
  { value: '30m', label: '30m', timeout: 30 * 60 * 1000 },
  { value: '1h', label: '1h', timeout: 60 * 60 * 1000 },
  { value: '2h', label: '2h', timeout: 2 * 60 * 60 * 1000 },
  { value: '1d', label: '1d', timeout: 24 * 60 * 60 * 1000 },
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
      'sum(deployment_price) as money',
      'sum(price) as aggregated_money',
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
      'sum(deployment_price) as money',
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

export const TRACES_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      '_time as completion_time',
      'model',
      'deployment',
      'parent_deployment',
      'execution_path',
      'trace_id',
      'core_span_id',
      'core_parent_span_id',
      'project_id',
      'language',
      'upstream',
      'topic',
      'title as user_title',
      'response_id',
      'user_hash',
      'deployment_price',
      'price',
      'number_request_messages',
      'chat_id',
      'prompt_tokens',
      'completion_tokens',
      //'cached_prompt_tokens',
    ],
    from: 'analytics',
  },
};

export const CONVERSATIONS_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      '_time as completion_time',
      'model',
      'deployment',
      'parent_deployment',
      'execution_path',
      'trace_id',
      'core_span_id',
      'core_parent_span_id',
      'project_id',
      'language',
      'upstream',
      'topic',
      'title as user_title',
      'response_id',
      'user_hash',
      'deployment_price',
      'price',
      'number_request_messages',
      'chat_id',
      'prompt_tokens',
      'completion_tokens',
      //'cached_prompt_tokens',
    ],
    from: 'analytics',
  },
};

export const TELEMETRY_GRID_HEADERS_MAP: Record<string, string> = {
  deployment: 'name',
  project_id: 'name',
  count: 'requests',
  money: 'cost',
  aggregated_money: 'deployment_cost',
  tokens_p: 'prompts',
  tokens_c: 'completions',
};
