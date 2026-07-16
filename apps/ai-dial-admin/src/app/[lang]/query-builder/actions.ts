'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { AnalyticsEntity, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getEntities(): Promise<AnalyticsEntity[] | null> {
  return analyticsDataApi.getEntities(await token());
}

export async function getEntitySchema(name: string): Promise<AnalyticsEntitySchema | null> {
  return analyticsDataApi.getEntitySchema(name, await token());
}

export async function getFunctions(): Promise<QueryFunction[] | null> {
  return analyticsDataApi.getFunctions(await token());
}

export async function executeQuery(query: StructuredQuery): Promise<ServerActionResponse<StructuredQueryResult>> {
  return analyticsDataApi.executeAction(query, await token());
}

export async function executeSqlQuery(sql: string): Promise<ServerActionResponse<StructuredQueryResult>> {
  return analyticsDataApi.executeSqlAction(sql, await token());
}
