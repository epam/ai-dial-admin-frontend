import Contains from '@/public/images/icons/filter/contains.svg';
import EndsWith from '@/public/images/icons/filter/ends-with.svg';
import NotContains from '@/public/images/icons/filter/not-contains.svg';
import StartsWith from '@/public/images/icons/filter/starts-with.svg';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { TelemetryQuery } from '@/src/models/telemetry';
import { ChartResolution, formatWindow } from '@/src/utils/time-filter/get-chart-resolution';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { IconEqual, IconEqualNot } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from './main-layout';

export const DEFAULT_REFRESH_TIME = '1m';

export const TELEMETRY_DATASET_NAME = 'dial_analytics_realtime';

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

export const mcpFilterTypeConfig = [
  { value: FILTER_TYPE.Mcp, label: TelemetryI18nKey.FilterTypeMcp, filter: 'deployment' },
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

export const getEntityQuery = (tableName = 'analytics'): TelemetryQuery => ({
  $type: 'json',
  query: {
    distinct: 'true',
    expressions: ['deployment'],
    from: tableName,
  },
});

export const getProjectQuery = (tableName = 'analytics'): TelemetryQuery => ({
  $type: 'json',
  query: {
    distinct: 'true',
    expressions: ['project_id'],
    from: tableName,
  },
});

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

export const createSystemUsageQuery = (resolution: ChartResolution): TelemetryQuery => ({
  $type: 'json',
  fillGaps: true,
  query: {
    expressions: [`${formatWindow(resolution)} as time`, 'count() as requests'],
    from: 'analytics',
    groupBy: [formatWindow(resolution)],
    orderBy: [{ $asc: 'time' }],
  },
});

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
    orderBy: [{ $desc: '_time' }],
  },
};

export const MCP_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      '_time as completion_time',
      'deployment',
      'project_id',
      'mcp_method',
      'mcp_tool_call_name',
      'trace_id',
    ],
    from: 'mcp_analytics',
    orderBy: [{ $desc: '_time' }],
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

export const MCP_TABLE_NAME = 'mcp_analytics';
export const TOOLSET_DEPLOYMENT_PREFIX = 'toolsets/';

export const createMcpUsageQuery = (resolution: ChartResolution): TelemetryQuery => ({
  $type: 'json',
  fillGaps: true,
  query: {
    expressions: [formatWindow(resolution), 'mcp_method', 'count()'],
    from: MCP_TABLE_NAME,
    groupBy: [formatWindow(resolution), 'mcp_method'],
    orderBy: [{ $asc: formatWindow(resolution) }],
  },
});

export const MCP_TOTAL_CALLS_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['count()'],
    from: MCP_TABLE_NAME,
  },
};

export const MCP_TOOL_CALLS_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['count()'],
    from: MCP_TABLE_NAME,
  },
};

export const MCP_TOOL_CALLS_EXTRA_CONDITIONS = [{ $eq: { left: 'mcp_method', right: "'tools/call'" } }];

export const MCP_CONSUMPTION_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['deployment', 'count()'],
    from: MCP_TABLE_NAME,
    groupBy: ['deployment'],
    orderBy: [{ $desc: 'count()' }],
  },
};

export const MCP_TOOLS_CONSUMPTION_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['deployment', 'mcp_tool_call_name', 'count()'],
    from: MCP_TABLE_NAME,
    groupBy: ['deployment', 'mcp_tool_call_name'],
    orderBy: [{ $desc: 'count()' }],
  },
};

export const MCP_TOOLS_CONSUMPTION_EXTRA_CONDITIONS = [{ $ne: { left: 'mcp_tool_call_name', right: "'undefined'" } }];

export const MCP_CALLS_BY_DEPLOYMENT_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['parent_deployment', 'deployment', 'count()'],
    from: MCP_TABLE_NAME,
    groupBy: ['parent_deployment', 'deployment'],
    orderBy: [{ $desc: 'count()' }],
  },
};

export const MCP_UNIQUE_USERS_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['count()'],
    from: {
      distinct: 'true',
      expressions: ['user_hash'],
      from: MCP_TABLE_NAME,
    },
  },
};

export const MCP_PROJECTS_CONSUMPTION_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      'project_id',
      "sum(case when mcp_method = 'tools/call' then 1 else 0 end) as tool_calls",
      'count() as mcp_calls',
    ],
    from: MCP_TABLE_NAME,
    groupBy: ['project_id'],
    orderBy: [{ $desc: 'count()' }],
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
  mcp_tool_call_name: 'mcp_tool_call_name',
  parent_deployment: 'parent_deployment',
  tool_calls: 'tool_calls',
  mcp_calls: 'mcp_calls',
};
