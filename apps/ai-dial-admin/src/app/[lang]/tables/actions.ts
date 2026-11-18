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
  TableAccessConfig,
  TableAccessEntryDto,
  TableAccessEntryResult,
  UpdateTableDto,
  WriteRowsDto,
} from '@/src/models/analytics/table';
import {
  IngestFailureFilters,
  IngestFailureList,
  IngestFailureRetryRequest,
  IngestFailureRetryResult,
} from '@/src/models/analytics/ingest-failure';
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

export async function getTableAccess(name: string): Promise<ServerActionResponse<TableAccessConfig>> {
  return analyticsDataApi.getTableAccess(name, await token());
}

export async function putTableAccessEntry(
  name: string,
  role: string,
  entry: TableAccessEntryDto,
): Promise<ServerActionResponse<TableAccessEntryResult>> {
  return analyticsDataApi.putTableAccessEntry(name, role, entry, await token());
}

export async function deleteTableAccessEntry(
  name: string,
  role: string,
  generation: number,
): Promise<ServerActionResponse> {
  return analyticsDataApi.deleteTableAccessEntry(name, role, generation, await token());
}

export async function startTableBackfill(
  from: string,
  to: string,
  includeIngested: boolean,
): Promise<ServerActionResponse<TableBackfillStart>> {
  return analyticsDataApi.startTableBackfill(from, to, includeIngested, await token());
}

export async function listTableBackfillRuns(
  state?: TableBackfillState,
): Promise<ServerActionResponse<TableBackfillRun[]>> {
  return analyticsDataApi.listTableBackfillRuns(await token(), state);
}

export async function listIngestFailures(
  filters: IngestFailureFilters,
): Promise<ServerActionResponse<IngestFailureList>> {
  return analyticsDataApi.listIngestFailures(filters, await token());
}

export async function retryIngestFailures(
  body: IngestFailureRetryRequest,
): Promise<ServerActionResponse<IngestFailureRetryResult>> {
  return analyticsDataApi.retryIngestFailures(body, await token());
}

export async function getRoles(): Promise<AnalyticsRoleCatalog> {
  const warnings: EntitiesI18nKey[] = [];
  const roles = await readConfigEntities<ConfigEntityRow>(await token(), ConfigFileEntityType.Roles, warnings);

  return { roles, warnings };
}
