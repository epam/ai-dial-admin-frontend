'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import {
  AnalyticsRoleCatalog,
  AnalyticsSchemaPatch,
  AnalyticsTable,
  CreateTableDto,
  DraftSchemaDto,
  RowPoliciesResponse,
  RowPolicy,
  TableAccess,
  TableAccessUpdateResult,
  UpdateTableDto,
  WriteRowsDto,
} from '@/src/models/analytics/table';
import { TableBackfillRun, TableBackfillStart, TableBackfillState } from '@/src/models/analytics/table-backfill';
import { ConfigEntityRow } from '@/src/models/dial/config-file';
import { ServerActionResponse } from '@/src/models/server-action';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getTables(): Promise<ServerActionResponse<AnalyticsTable[]>> {
  return analyticsDataApi.getTables(await token());
}

export async function getTable(name: string): Promise<ServerActionResponse<AnalyticsTable>> {
  return analyticsDataApi.getTable(name, await token());
}

export async function createTable(dto: CreateTableDto): Promise<ServerActionResponse> {
  return analyticsDataApi.createTable(dto, await token());
}

export async function updateTable(name: string, dto: UpdateTableDto): Promise<ServerActionResponse> {
  return analyticsDataApi.updateTable(name, dto, await token());
}

export async function deleteTable(name: string): Promise<ServerActionResponse> {
  return analyticsDataApi.deleteTable(name, await token());
}

export async function defineTableSchema(name: string, dto: DraftSchemaDto): Promise<ServerActionResponse> {
  return analyticsDataApi.defineTableSchema(name, dto, await token());
}

export async function updateTableSchema(name: string, patch: AnalyticsSchemaPatch): Promise<ServerActionResponse> {
  return analyticsDataApi.updateTableSchema(name, patch, await token());
}

export async function addRows(name: string, dto: WriteRowsDto): Promise<ServerActionResponse> {
  return analyticsDataApi.addRows(name, dto, await token());
}

export async function getTableAccess(name: string): Promise<ServerActionResponse<TableAccess>> {
  return analyticsDataApi.getTableAccess(name, await token());
}

export async function updateTableAccess(
  name: string,
  access: Partial<TableAccess>,
): Promise<ServerActionResponse<TableAccessUpdateResult>> {
  return analyticsDataApi.updateTableAccess(name, access, await token());
}

export async function getRowPolicies(name: string): Promise<ServerActionResponse<RowPoliciesResponse>> {
  return analyticsDataApi.getRowPolicies(name, await token());
}

export async function putRowPolicy(
  name: string,
  role: string,
  policy: RowPolicy,
): Promise<ServerActionResponse<RowPolicy>> {
  return analyticsDataApi.putRowPolicy(name, role, policy, await token());
}

// A 404 means the role has no policy on the table, which is the state a delete is after — not a failure.
export async function deleteRowPolicy(name: string, role: string): Promise<ServerActionResponse> {
  const res = await analyticsDataApi.deleteRowPolicy(name, role, await token());

  return res.status === 404 ? { success: true } : res;
}

export async function startTableBackfill(from: string, to: string): Promise<ServerActionResponse<TableBackfillStart>> {
  return analyticsDataApi.startTableBackfill(from, to, await token());
}

export async function listTableBackfillRuns(
  state?: TableBackfillState,
): Promise<ServerActionResponse<TableBackfillRun[]>> {
  return analyticsDataApi.listTableBackfillRuns(await token(), state);
}

export async function getRoles(): Promise<AnalyticsRoleCatalog> {
  const warnings: EntitiesI18nKey[] = [];
  const roles = await readConfigEntities<ConfigEntityRow>(await token(), ConfigFileEntityType.Roles, warnings);

  return { roles, warnings };
}
