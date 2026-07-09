'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { AnalyticsSchemaPatch, AnalyticsTable, CreateTableDto, WriteRowsDto } from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getTables(): Promise<AnalyticsTable[] | null> {
  return analyticsDataApi.getTables(await token());
}

export async function getTable(name: string): Promise<AnalyticsTable | null> {
  return analyticsDataApi.getTable(name, await token());
}

export async function createTable(dto: CreateTableDto): Promise<ServerActionResponse> {
  return analyticsDataApi.createTable(dto, await token());
}

export async function deleteTable(name: string): Promise<ServerActionResponse> {
  return analyticsDataApi.deleteTable(name, await token());
}

export async function updateTableSchema(name: string, patch: AnalyticsSchemaPatch): Promise<ServerActionResponse> {
  return analyticsDataApi.updateTableSchema(name, patch, await token());
}

export async function addRows(name: string, dto: WriteRowsDto): Promise<ServerActionResponse> {
  return analyticsDataApi.addRows(name, dto, await token());
}
