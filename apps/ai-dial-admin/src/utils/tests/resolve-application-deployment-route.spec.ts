import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ApplicationRoute } from '@/src/types/routes';
import { resolveApplicationDeploymentRoute } from '@/src/utils/resolve-application-deployment-route';

const getPlatformApplicationMock = vi.fn();

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getPlatformApplication: (...args: unknown[]) => getPlatformApplicationMock(...args),
}));

describe('resolveApplicationDeploymentRoute', () => {
  beforeEach(() => {
    getPlatformApplicationMock.mockReset();
  });

  test('routes applications/ ids to AssetsApplications without a lookup', async () => {
    await expect(resolveApplicationDeploymentRoute('applications/platform/my-app')).resolves.toBe(
      ApplicationRoute.AssetsApplications,
    );
    expect(getPlatformApplicationMock).not.toHaveBeenCalled();
  });

  test('routes to AssetsApplications when the platform resource exists', async () => {
    getPlatformApplicationMock.mockResolvedValue({ response: { name: 'world-economy-v2-hybrid' } });

    await expect(resolveApplicationDeploymentRoute('world-economy-v2-hybrid')).resolves.toBe(
      ApplicationRoute.AssetsApplications,
    );
    expect(getPlatformApplicationMock).toHaveBeenCalledWith('platform/world-economy-v2-hybrid', DEFAULT_ETAG);
  });

  test('falls back to Entities Applications when the platform lookup misses', async () => {
    getPlatformApplicationMock.mockResolvedValue(null);

    await expect(resolveApplicationDeploymentRoute('legacy-app')).resolves.toBe(ApplicationRoute.Applications);
  });
});
