'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  CreatePipelineDto,
  Pipeline,
  PipelineEnabledDto,
  PipelineListItem,
  PipelinesListFilters,
} from '@/src/models/analytics/pipeline';
import { AnalyticsTable } from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { toPipelineListItem } from '@/src/utils/analytics/pipeline-list-item';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getPipelines(filters?: PipelinesListFilters): Promise<ServerActionResponse<PipelineListItem[]>> {
  const result = await analyticsDataApi.getPipelines(filters, await token());

  return result.success ? { ...result, response: (result.response as Pipeline[]).map(toPipelineListItem) } : result;
}

export async function getPipeline(name: string): Promise<ServerActionResponse<Pipeline>> {
  return analyticsDataApi.getPipeline(name, await token());
}

export async function createPipeline(dto: CreatePipelineDto): Promise<ServerActionResponse> {
  return analyticsDataApi.createPipeline(dto, await token());
}

export async function updatePipeline(
  name: string,
  dto: CreatePipelineDto | PipelineEnabledDto,
): Promise<ServerActionResponse> {
  return analyticsDataApi.updatePipeline(name, dto, await token());
}

export async function deletePipeline(name: string): Promise<ServerActionResponse> {
  return analyticsDataApi.deletePipeline(name, await token());
}

export async function getTables(): Promise<AnalyticsTable[] | null> {
  return (await analyticsDataApi.getTables(await token())).response ?? null;
}

export async function getTable(name: string): Promise<AnalyticsTable | null> {
  return (await analyticsDataApi.getTable(name, await token())).response ?? null;
}
