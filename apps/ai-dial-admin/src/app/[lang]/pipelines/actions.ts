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
import { DlqFilters, DlqPage, DlqRequeueResponse } from '@/src/models/analytics/pipeline-dlq';
import {
  PausedPipeline,
  PipelineRuntimeView,
  RUNNER_NOT_CONFIGURED,
  RunnerPipelineEntry,
} from '@/src/models/analytics/pipeline-runtime';
import { AnalyticsTable } from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { toPipelineListItem } from '@/src/utils/analytics/pipeline-list-item';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

/**
 * What every runner action answers when no host is configured, without issuing a request.
 *
 * Marked rather than bare, because the presenter has to tell it from a read that failed: an absent
 * service means the console withholds the affordance in silence, where a refusal means it says so and
 * offers to try again.
 */
const noRunner = <T extends object>(): ServerActionResponse<T> => ({
  success: false,
  errorHeader: RUNNER_NOT_CONFIGURED,
});

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
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.getPaused(await token());
}

/**
 * One pipeline's runtime view.
 *
 * Unlike the two listings beside it this is a per-pipeline read, and its failures are part of its
 * answer: the runner says through them that it has not synced yet, or that it does not hold this
 * pipeline at all. The envelope is passed through untouched so the caller can tell those apart.
 */
export async function getPipelineRuntimeView(name: string): Promise<ServerActionResponse<PipelineRuntimeView>> {
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.getRuntimeView(name, await token());
}

/** The pipelines the runner has taken on; answered without a request when no runner is configured. */
export async function getRunnerPipelines(): Promise<ServerActionResponse<RunnerPipelineEntry[]>> {
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.getCache(await token());
}

// Both verbs guard the host the way the two reads do: without a runner there is nothing to act on, and
// a request to an empty host would fail as a service error rather than as the deployment choice it is.
export async function pausePipeline(name: string): Promise<ServerActionResponse> {
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.pause(name, await token());
}

export async function resumePipeline(name: string): Promise<ServerActionResponse> {
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.resume(name, await token());
}

/**
 * One page of a pipeline's dead letters, with the counts of everything the filter matches. Guarded like
 * the rest of the runner surface: with no host there is nothing to read, and the caller presents no
 * failures card rather than an error.
 */
export async function getPipelineFailures(
  name: string,
  filters: DlqFilters,
  limit: number,
  cursor?: string,
): Promise<ServerActionResponse<DlqPage>> {
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.getDlq(name, filters, limit, cursor, await token());
}

export async function requeueFailure(id: number): Promise<ServerActionResponse<DlqRequeueResponse>> {
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.requeueDlqItem(id, await token());
}

/**
 * Every requeueable dead letter of the pipeline, or of one of its backfill runs. The service selects the
 * items and reports how many it re-ran, which can be fewer than the caller counted: it skips what it
 * refuses rather than failing the batch.
 */
export async function requeueFailures(name: string, runId?: string): Promise<ServerActionResponse<DlqRequeueResponse>> {
  if (!analyticsRunnerApi.isConfigured) return noRunner();

  return analyticsRunnerApi.requeueDlq(name, runId, await token());
}

export async function getTables(): Promise<AnalyticsTable[] | null> {
  return (await analyticsDataApi.getTables(await token())).response ?? null;
}

export async function getTable(name: string): Promise<AnalyticsTable | null> {
  return (await analyticsDataApi.getTable(name, await token())).response ?? null;
}
