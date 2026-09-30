'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi, analyticsRunnerApi } from '@/src/app/api/api';
import {
  CreatePipelineDto,
  Pipeline,
  PipelineEnabledDto,
  PipelineListItem,
  PipelinesListFilters,
} from '@/src/models/analytics/pipeline';
import { PausedPipeline, RunnerPipelineEntry } from '@/src/models/analytics/pipeline-runtime';
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

/**
 * The paused pipelines, or a failure the caller presents as "not read".
 *
 * An installation without a runner host is answered without a request: it has no runtime to report, and
 * calling out to an empty host would turn a deployment choice into a logged failure.
 */
export async function getPausedPipelines(): Promise<ServerActionResponse<PausedPipeline[]>> {
  if (!analyticsRunnerApi.isConfigured) return { success: false };

  return analyticsRunnerApi.getPaused(await token());
}

/** The pipelines the runner has taken on; answered without a request when no runner is configured. */
export async function getRunnerPipelines(): Promise<ServerActionResponse<RunnerPipelineEntry[]>> {
  if (!analyticsRunnerApi.isConfigured) return { success: false };

  return analyticsRunnerApi.getCache(await token());
}

// Both verbs guard the host the way the two reads do: without a runner there is nothing to act on, and
// a request to an empty host would fail as a service error rather than as the deployment choice it is.
export async function pausePipeline(name: string): Promise<ServerActionResponse> {
  if (!analyticsRunnerApi.isConfigured) return { success: false };

  return analyticsRunnerApi.pause(name, await token());
}

export async function resumePipeline(name: string): Promise<ServerActionResponse> {
  if (!analyticsRunnerApi.isConfigured) return { success: false };

  return analyticsRunnerApi.resume(name, await token());
}

export async function getTables(): Promise<AnalyticsTable[] | null> {
  return (await analyticsDataApi.getTables(await token())).response ?? null;
}

export async function getTable(name: string): Promise<AnalyticsTable | null> {
  return (await analyticsDataApi.getTable(name, await token())).response ?? null;
}
