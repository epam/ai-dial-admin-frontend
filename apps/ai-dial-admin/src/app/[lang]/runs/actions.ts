'use server';

import { cookies, headers } from 'next/headers';

import { analyticsApi, runsApi, structuredQueryApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { FilterDto, SortDto } from '@/src/models/request';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';

export async function getRuns(page: number, size: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runsApi.getRuns(page, size, sorts, filters, token);
}

export async function getRun(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runsApi.getRun(id, token);
}

export async function removeRun(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runsApi.removeRun(id, token);
}

export async function getRunResults(filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runsApi.getRunResults(token, filters);
}

export async function getTestCaseRunResults(filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return analyticsApi.getTestCaseRunResults(filters, token);
}

export async function getTestCaseRunResultDetails(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return analyticsApi.getTestCaseRunResultDetails(id, token);
}

export async function getMetricSnapshots(filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return analyticsApi.getMetricSnapshots(filters, token);
}

export async function exportRunPreview(runId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return analyticsApi.exportPreview(runId, token);
}

export async function executeStructuredQuery(query: StructuredQuery) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return structuredQueryApi.execute(query, token);
}
