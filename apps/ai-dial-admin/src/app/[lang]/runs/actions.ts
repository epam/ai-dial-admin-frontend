'use server';

import { cookies, headers } from 'next/headers';

import { analyticsApi, runsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { FilterDto } from '@/src/models/request';

export async function getRuns(page: number, size: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runsApi.getRuns(page, size, token);
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
