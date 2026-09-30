import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsRunnerApi } from '@/src/app/api/api';
import {
  getPausedPipelines,
  getRunnerPipelines,
  pausePipeline,
  resumePipeline,
} from '@/src/app/[lang]/pipelines/actions';
import { PauseOrigin } from '@/src/models/analytics/pipeline-runtime';
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
    const paused = [{ pipelineName: 'usage-live', origin: PauseOrigin.Operator, since: '2026-09-21T15:00:00Z' }];
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
    expect(res).toEqual({ success: false });
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
    expect(res).toEqual({ success: false });
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
});
