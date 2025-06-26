'use server';

import { cookies, headers } from 'next/headers';

import { activityAuditApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { FilterDto, SortDto } from '@/src/models/request';

export async function getActivities(pageSize: number, pageNumber: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return activityAuditApi.getActivitiesList(pageSize, pageNumber, token, sorts, filters);
}

export async function getRevisionDetails(url: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return activityAuditApi.getRevisionDetails(url, token);
}

export async function getEntitiesForRevision(url: string, revision?: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return activityAuditApi.getEntitiesForRevision(`${url}${revision}`, token);
}

export async function systemRollbackToRevision(revision?: number) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return activityAuditApi.rollbackToRevision(revision, token);
}

export async function getRevisions(pageSize: number, pageNumber: number, sorts: SortDto[], filters: FilterDto[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return activityAuditApi.getRevisions(pageSize, pageNumber, token, sorts, filters);
}
