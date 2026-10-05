import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsRunnerApi } from '@/src/app/api/api';
import {
  getPausedPipelines,
  getPipelineFailures,
  getPipelineGroups,
  getRunnerPipelines,
  pausePipeline,
  queueGroupEvaluation,
  requeueFailure,
  requeueFailures,
  resumePipeline,
} from '@/src/app/[lang]/pipelines/actions';
import { DlqLane } from '@/src/models/analytics/pipeline-dlq';
import { PauseOrigin, RUNNER_NOT_CONFIGURED } from '@/src/models/analytics/pipeline-runtime';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const runner = vi.mocked(analyticsRunnerApi);

const asConfigured = (isConfigured: boolean) =>
  Object.defineProperty(runner, 'isConfigured', { value: isConfigured, configurable: true });

describe('Pipeline runtime server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
    asConfigured(true);
  });

  test('getPausedPipelines reads the runner with the caller token', async () => {
    const paused = [{ pipeline_name: 'usage-live', origin: PauseOrigin.Operator, since: '2026-09-21T15:00:00Z' }];
    runner.getPaused.mockResolvedValue({ success: true, response: paused });

    const res = await getPausedPipelines();

    expect(runner.getPaused).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(res).toEqual({ success: true, response: paused });
  });

  // An installation without a runner has no runtime to report; calling an empty host would turn a
  // deployment choice into a logged failure.
  test('getPausedPipelines issues no request when no runner host is configured', async () => {
    asConfigured(false);

    const res = await getPausedPipelines();

    expect(runner.getPaused).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false, errorHeader: RUNNER_NOT_CONFIGURED });
  });

  test('getPausedPipelines carries a refusal through untouched', async () => {
    runner.getPaused.mockResolvedValue({ success: false, errorHeader: 'pipeline_cache_cold', status: 503 });

    const res = await getPausedPipelines();

    expect(res).toEqual(expect.objectContaining({ success: false, errorHeader: 'pipeline_cache_cold' }));
  });

  test('getRunnerPipelines reads the runner cache with the caller token', async () => {
    const pipelines = [{ name: 'usage-live', enabled: true, generation: 7 }];
    runner.getCache.mockResolvedValue({ success: true, response: pipelines });

    const res = await getRunnerPipelines();

    expect(runner.getCache).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(res).toEqual({ success: true, response: pipelines });
  });

  test('getRunnerPipelines issues no request when no runner host is configured', async () => {
    asConfigured(false);

    const res = await getRunnerPipelines();

    expect(runner.getCache).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false, errorHeader: RUNNER_NOT_CONFIGURED });
  });

  test('pausePipeline pauses the named pipeline with the caller token', async () => {
    runner.pause.mockResolvedValue({ success: true });

    const res = await pausePipeline('usage-live');

    expect(runner.pause).toHaveBeenCalledWith('usage-live', TOKEN_MOCK);
    expect(res.success).toBe(true);
  });

  test('resumePipeline resumes the named pipeline with the caller token', async () => {
    runner.resume.mockResolvedValue({ success: true });

    const res = await resumePipeline('usage-live');

    expect(runner.resume).toHaveBeenCalledWith('usage-live', TOKEN_MOCK);
    expect(res.success).toBe(true);
  });
  const EMPTY_PAGE = { items: [], has_more: false, total: 0, requeueable_total: 0 };

  test('getPipelineFailures reads one page with the caller token, the filters and the cursor', async () => {
    runner.getDlq.mockResolvedValue({ success: true, response: EMPTY_PAGE });

    await getPipelineFailures('usage-live', { lane: DlqLane.Backfill }, 20, 'djE6MQ');

    expect(runner.getDlq).toHaveBeenCalledWith('usage-live', { lane: DlqLane.Backfill }, 20, 'djE6MQ', TOKEN_MOCK);
  });

  test('getPipelineFailures issues no request when no runner host is configured', async () => {
    asConfigured(false);

    const res = await getPipelineFailures('usage-live', {}, 20);

    expect(runner.getDlq).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false, errorHeader: RUNNER_NOT_CONFIGURED });
  });

  // A failed read must not reach the card as an empty list: on a failure listing the two are opposite
  // conclusions.
  test('getPipelineFailures carries a refusal through rather than an empty list', async () => {
    runner.getDlq.mockResolvedValue({ success: false, status: 503, errorHeader: 'postgres_unavailable' });

    const res = await getPipelineFailures('usage-live', {}, 20);

    expect(res).toEqual(expect.objectContaining({ success: false, errorHeader: 'postgres_unavailable' }));
    expect(res.response).toBeUndefined();
  });

  test('requeueFailure re-runs one item with the caller token', async () => {
    runner.requeueDlqItem.mockResolvedValue({ success: true, response: { requeued: 1 } });

    const res = await requeueFailure(48226);

    expect(runner.requeueDlqItem).toHaveBeenCalledWith(48226, TOKEN_MOCK);
    expect(res.response).toEqual({ requeued: 1 });
  });

  test('requeueFailure issues no request when no runner host is configured', async () => {
    asConfigured(false);

    const res = await requeueFailure(48226);

    expect(runner.requeueDlqItem).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false, errorHeader: RUNNER_NOT_CONFIGURED });
  });

  test('requeueFailures re-runs the whole pipeline when no run is named', async () => {
    runner.requeueDlq.mockResolvedValue({ success: true, response: { requeued: 4 } });

    await requeueFailures('usage-live');

    expect(runner.requeueDlq).toHaveBeenCalledWith('usage-live', undefined, TOKEN_MOCK);
  });

  test('requeueFailures scopes the re-run to a named run', async () => {
    runner.requeueDlq.mockResolvedValue({ success: true, response: { requeued: 2 } });

    await requeueFailures('usage-live', 'run-7');

    expect(runner.requeueDlq).toHaveBeenCalledWith('usage-live', 'run-7', TOKEN_MOCK);
  });

  test('requeueFailures issues no request when no runner host is configured', async () => {
    asConfigured(false);

    const res = await requeueFailures('usage-live');

    expect(runner.requeueDlq).not.toHaveBeenCalled();
    expect(res).toEqual({ success: false, errorHeader: RUNNER_NOT_CONFIGURED });
  });

  test('getPipelineGroups reads the runner with the requested limit and the caller token', async () => {
    runner.getGroups.mockResolvedValue({ success: true, response: [] });

    await getPipelineGroups('retrieval-quality', 500);

    expect(runner.getGroups).toHaveBeenCalledWith('retrieval-quality', 500, TOKEN_MOCK);
  });

  test('queueGroupEvaluation queues the named group with the caller token', async () => {
    runner.requeueGroup.mockResolvedValue({ success: true });

    await queueGroupEvaluation('retrieval-quality', 'sess_A');

    expect(runner.requeueGroup).toHaveBeenCalledWith('retrieval-quality', 'sess_A', TOKEN_MOCK);
  });

  test('the group actions issue no request when no runner host is configured', async () => {
    asConfigured(false);

    expect(await getPipelineGroups('retrieval-quality', 1)).toEqual({
      success: false,
      errorHeader: RUNNER_NOT_CONFIGURED,
    });
    expect(await queueGroupEvaluation('retrieval-quality', 'sess_A')).toEqual({
      success: false,
      errorHeader: RUNNER_NOT_CONFIGURED,
    });
    expect(runner.getGroups).not.toHaveBeenCalled();
    expect(runner.requeueGroup).not.toHaveBeenCalled();
  });
});
