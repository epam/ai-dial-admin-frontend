import { TelemetryQuery } from '@/src/models/telemetry';
import { ChartResolution, formatWindow } from '@/src/utils/time-filter/get-chart-resolution';

export const DEFAULT_REFRESH_TIME = '1m';

export const TELEMETRY_DATASET_NAME = 'dial_analytics_realtime';
export const TOOLSET_DEPLOYMENT_PREFIX = 'toolsets/';

const ANALYTICS_TABLE_NAME = 'analytics';
export const MCP_TABLE_NAME = 'mcp_analytics';
export const ROUTE_TABLE_NAME = 'routes_analytics';

const getUniqueUsersQuery = (tableName: string, params?: Record<string, string | string[]>): TelemetryQuery =>
  getCountQuery(tableName, {
    from: {
      distinct: 'true',
      expressions: ['user_hash'],
      from: tableName,
      ...(params || {}),
    },
  });

const getCountQuery = (tableName: string, params?: Record<string, any>): TelemetryQuery => ({
  $type: 'json',
  query: {
    expressions: ['count()'],
    from: tableName,
    ...(params || {}),
  },
});

export const UNIQ_USERS_QUERY: TelemetryQuery = getUniqueUsersQuery(ANALYTICS_TABLE_NAME, { distinct: 'true' });

export const REQUEST_COUNT_QUERY: TelemetryQuery = getCountQuery(ANALYTICS_TABLE_NAME);

export const TOTAL_TOKENS_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['sum(prompt_tokens)', 'sum(completion_tokens)'],
    from: ANALYTICS_TABLE_NAME,
  },
};

export const MONEY_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['sum(deployment_price)'],
    from: ANALYTICS_TABLE_NAME,
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
    from: ANALYTICS_TABLE_NAME,
    groupBy: ['deployment'],
  },
};

export const ENTITY_CONSUMPTION_TREE_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      'deployment',
      'parent_deployment',
      'execution_path',
      'count()',
      'sum(deployment_price) as money',
      'sum(price) as aggregated_money',
      'sum(prompt_tokens) as tokens_p',
      'sum(completion_tokens) as tokens_c',
    ],
    from: ANALYTICS_TABLE_NAME,
    groupBy: ['deployment', 'parent_deployment', 'execution_path'],
  },
};

export const getEntityQuery = (tableName = ANALYTICS_TABLE_NAME): TelemetryQuery => ({
  $type: 'json',
  query: {
    distinct: 'true',
    expressions: ['deployment'],
    from: tableName,
  },
});

export const getProjectQuery = (tableName = ANALYTICS_TABLE_NAME): TelemetryQuery => ({
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
    from: ANALYTICS_TABLE_NAME,
    groupBy: ['project_id'],
  },
};

export const createSystemUsageQuery = (resolution: ChartResolution): TelemetryQuery => ({
  $type: 'json',
  fillGaps: true,
  query: {
    expressions: [`${formatWindow(resolution)} as time`, 'count() as requests'],
    from: ANALYTICS_TABLE_NAME,
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
    ],
    from: ANALYTICS_TABLE_NAME,
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
    from: MCP_TABLE_NAME,
  },
};

export const ROUTES_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: [
      '_time as completion_time',
      'deployment',
      'project_id',
      'route_path',
      'http_method',
      'upstream',
      'trace_id',
    ],
    from: ROUTE_TABLE_NAME,
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
    ],
    from: ANALYTICS_TABLE_NAME,
  },
};

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

export const MCP_TOTAL_CALLS_QUERY: TelemetryQuery = getCountQuery(MCP_TABLE_NAME);

export const MCP_TOOL_CALLS_QUERY: TelemetryQuery = getCountQuery(MCP_TABLE_NAME);

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
  execution_path: 'execution_path',
  tool_calls: 'tool_calls',
  mcp_calls: 'mcp_calls',
  route_path: 'route_path',
  http_method: 'http_method',
};

export const USAGE_LOG_COLUMN_ID_TO_SOURCE: Record<string, string> = {
  completion_time: '_time',
  user_title: 'title',
};

export const USAGE_LOG_DEFAULT_ORDER_BY: Record<string, string>[] = [{ $desc: '_time' }];

export const USAGE_LOG_TEXT_OPERATOR_MAP: Record<string, string> = {
  contains: '$contains',
  notContains: '$not_contains',
  equals: '$eq',
  notEqual: '$ne',
  startsWith: '$starts_with',
  endsWith: '$ends_with',
  lessThan: '$lt',
  lessThanOrEqual: '$lte',
  greaterThan: '$gt',
  greaterThanOrEqual: '$gte',
};

export const ROUTE_UNIQUE_USERS_QUERY: TelemetryQuery = getUniqueUsersQuery(ROUTE_TABLE_NAME);

export const ROUTE_TOTAL_CALLS_QUERY: TelemetryQuery = getCountQuery(ROUTE_TABLE_NAME);

export const createRouteUsageQuery = (resolution: ChartResolution): TelemetryQuery => ({
  $type: 'json',
  fillGaps: true,
  query: {
    expressions: [formatWindow(resolution), 'count()'],
    from: ROUTE_TABLE_NAME,
    groupBy: [formatWindow(resolution)],
    orderBy: [{ $asc: formatWindow(resolution) }],
  },
});

export const ROUTE_DEPLOYMENT_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['deployment', 'count()'],
    from: ROUTE_TABLE_NAME,
    groupBy: ['deployment'],
    orderBy: [{ $desc: 'count()' }],
  },
};

export const ROUTE_PARENT_DEPLOYMENT_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['parent_deployment', 'deployment', 'count()'],
    from: ROUTE_TABLE_NAME,
    groupBy: ['parent_deployment', 'deployment'],
    orderBy: [{ $desc: 'count()' }],
  },
};

export const ROUTE_PROJECT_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['project_id', 'count()'],
    from: ROUTE_TABLE_NAME,
    groupBy: ['project_id'],
    orderBy: [{ $desc: 'count()' }],
  },
};

export const ROUTE_QUERY: TelemetryQuery = {
  $type: 'json',
  query: {
    expressions: ['deployment', 'route_path', 'http_method', 'count()'],
    from: ROUTE_TABLE_NAME,
    groupBy: ['deployment', 'route_path', 'http_method'],
    orderBy: [{ $desc: 'count()' }],
  },
};
