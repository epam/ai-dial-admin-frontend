'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi, dashboardsApi } from '@/src/app/api/api';
import { Token } from '@/src/models/auth';
import {
  Dashboard,
  DashboardList,
  DashboardRequest,
  ResolvedDashboard,
  WidgetInlineQuery,
  WidgetQuery,
  WidgetQueryKind,
  WidgetQuerySource,
} from '@/src/models/analytics/dashboard';
import { WIDGET_DENIED_STATUSES } from '@/src/constants/analytics/dashboards';
import { ServerActionResponse } from '@/src/models/server-action';
import { errorObjLog } from '@/src/server/logger';
import { getWidgetQueryKey } from '@/src/utils/analytics/widget-source';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsCustomDashboardsEnabled } from '@/src/utils/env/get-custom-dashboards-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

const DISABLED: ServerActionResponse = {
  success: false,
  status: 404,
  errorMessage: 'Custom dashboards are not enabled.',
};

const UNAVAILABLE: WidgetQuery = { kind: WidgetQueryKind.Unavailable };
const FAILED: WidgetQuery = { kind: WidgetQueryKind.Failed };

/**
 * Resolves a query body into what a widget runs. SQL is translated here, once per load, because the
 * translation does not depend on the range; a statement the service cannot translate — or a translation
 * that fails in transit, which reads the same — runs as written.
 */
const resolveSource = async (savedQuery: WidgetQuerySource, userToken: Token): Promise<WidgetQuery> => {
  let query = savedQuery.query;
  if (!query && savedQuery.sql) {
    const translated = await analyticsDataApi.translateSqlAction(savedQuery.sql, userToken);
    if (!translated.success || !translated.response) {
      return { kind: WidgetQueryKind.CompositeSql, savedQuery, sql: savedQuery.sql };
    }
    query = translated.response.query;
  }
  if (!query) return UNAVAILABLE;

  // Without its fields the run could not be bound to the range, and would silently cover all time.
  const schema = await analyticsDataApi.getEntitySchema(query.entity, userToken);
  if (!schema.success || !schema.response) return FAILED;
  return { kind: WidgetQueryKind.Structured, savedQuery, query, fields: schema.response.fields };
};

// A saved query the caller cannot read answers as a missing one, and both resolve as unavailable; any other
// failure may pass, so it resolves as failed and the widget offers Retry.
const resolveQuery = async (savedQueryId: string, userToken: Token): Promise<WidgetQuery> => {
  const read = await analyticsDataApi.getSavedQuery(savedQueryId, userToken);
  if (read.success && read.response) return resolveSource(read.response, userToken);
  return read.status != null && WIDGET_DENIED_STATUSES.includes(read.status) ? UNAVAILABLE : FAILED;
};

/** One widget's resolution, so a resolution that throws fails that widget alone rather than the whole page. */
const settle = async (resolve: () => Promise<WidgetQuery>): Promise<WidgetQuery> => {
  try {
    return await resolve();
  } catch (e) {
    errorObjLog(e, 'Failed to resolve a dashboard widget query');
    return FAILED;
  }
};

export async function listDashboards(): Promise<ServerActionResponse<DashboardList>> {
  if (!getIsCustomDashboardsEnabled()) return DISABLED;
  return dashboardsApi.listDashboards(await token());
}

export async function getResolvedDashboard(id: string): Promise<ServerActionResponse<ResolvedDashboard>> {
  if (!getIsCustomDashboardsEnabled()) return DISABLED;

  const userToken = await token();
  const read = await dashboardsApi.getDashboard(id, userToken);
  if (!read.success || !read.response) {
    const { status, errorHeader, errorMessage } = read;
    return { success: false, status, errorHeader, errorMessage };
  }

  const dashboard = read.response;
  // One resolution per saved query however many widgets show it, and one per inline query.
  const sources = new Map<string, () => Promise<WidgetQuery>>();
  for (const widget of dashboard.widgets) {
    const { saved_query_id: savedQueryId, inline_query: inlineQuery } = widget;
    const key = getWidgetQueryKey(widget);
    if (savedQueryId) sources.set(key, () => resolveQuery(savedQueryId, userToken));
    else if (inlineQuery) sources.set(key, () => resolveSource(inlineQuery, userToken));
  }
  const keys = [...sources.keys()];
  const resolved = await Promise.all([...sources.values()].map(settle));

  return {
    success: true,
    response: { dashboard, queries: Object.fromEntries(keys.map((key, i) => [key, resolved[i]])) },
  };
}

/** Resolves a saved query a widget was given after its dashboard was loaded. */
export async function resolveWidgetQuery(savedQueryId: string): Promise<WidgetQuery> {
  if (!getIsCustomDashboardsEnabled()) return UNAVAILABLE;
  return settle(async () => resolveQuery(savedQueryId, await token()));
}

/** Resolves an inline query a widget was given or changed after its dashboard was loaded. */
export async function resolveInlineWidgetQuery(inlineQuery: WidgetInlineQuery): Promise<WidgetQuery> {
  if (!getIsCustomDashboardsEnabled()) return UNAVAILABLE;
  return settle(async () => resolveSource(inlineQuery, await token()));
}

export async function getDashboard(id: string): Promise<ServerActionResponse<Dashboard>> {
  if (!getIsCustomDashboardsEnabled()) return DISABLED;
  return dashboardsApi.getDashboard(id, await token());
}

export async function createDashboard(request: DashboardRequest): Promise<ServerActionResponse<Dashboard>> {
  if (!getIsCustomDashboardsEnabled()) return DISABLED;
  return dashboardsApi.createDashboard(request, await token());
}

export async function replaceDashboard(
  id: string,
  request: DashboardRequest,
  generation: number,
): Promise<ServerActionResponse<Dashboard>> {
  if (!getIsCustomDashboardsEnabled()) return DISABLED;
  return dashboardsApi.replaceDashboard(id, request, generation, await token());
}

export async function deleteDashboard(id: string): Promise<ServerActionResponse> {
  if (!getIsCustomDashboardsEnabled()) return DISABLED;
  return dashboardsApi.deleteDashboard(id, await token());
}
