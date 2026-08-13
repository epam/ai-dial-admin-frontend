'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi, queryAssistantApi } from '@/src/app/api/api';
import { AnalyticsEntity, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { ChatCompletionResponse, QueryAssistantMessage } from '@/src/models/analytics/query-assistant';
import { QueryFunction } from '@/src/models/analytics/query-function';
import {
  StructuredQuery,
  StructuredQueryResult,
  TranslateResponse,
  TranslateSqlResponse,
} from '@/src/models/analytics/query';
import { SavedQuery, SavedQueryRequest, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function listSavedQueries(scope: SavedQueryScope): Promise<SavedQuery[] | null> {
  return analyticsDataApi.listSavedQueries(scope, await token());
}

export async function getSavedQuery(id: string): Promise<SavedQuery | null> {
  return analyticsDataApi.getSavedQuery(id, await token());
}

export async function createSavedQuery(dto: SavedQueryRequest): Promise<ServerActionResponse<SavedQuery>> {
  return analyticsDataApi.createSavedQuery(dto, await token());
}

export async function updateSavedQuery(id: string, dto: SavedQueryRequest): Promise<ServerActionResponse<SavedQuery>> {
  return analyticsDataApi.updateSavedQuery(id, dto, await token());
}

export async function deleteSavedQuery(id: string): Promise<ServerActionResponse> {
  return analyticsDataApi.deleteSavedQuery(id, await token());
}

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

export async function translateQuery(query: StructuredQuery): Promise<ServerActionResponse<TranslateResponse>> {
  return analyticsDataApi.translateAction(query, await token());
}

export async function translateSqlToQuery(sql: string): Promise<ServerActionResponse<TranslateSqlResponse>> {
  return analyticsDataApi.translateSqlAction(sql, await token());
}

export async function generateQuery(
  messages: QueryAssistantMessage[],
): Promise<ServerActionResponse<ChatCompletionResponse>> {
  const deployment = process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT;
  if (!deployment) {
    return { success: false, status: 0, errorMessage: 'Query assistant is not configured.' };
  }
  return queryAssistantApi.chatCompletion(messages, deployment, await token());
}
