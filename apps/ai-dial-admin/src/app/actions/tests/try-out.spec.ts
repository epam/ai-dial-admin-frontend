import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTryOutInterfaces } from '@/src/app/actions/try-out';
import { coreUtilityApi } from '@/src/app/api/api';
import { TryOutFailureKind } from '@/src/components/TryOut/Deployment/models';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api', () => ({ coreUtilityApi: { getDeploymentInfoResult: vi.fn() } }));
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');

describe('getTryOutInterfaces', () => {
  beforeEach(() => {
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
  });

  test("looks the deployment up with the signed-in admin's token", async () => {
    vi.mocked(coreUtilityApi.getDeploymentInfoResult).mockResolvedValue({ success: true, response: {} } as never);

    await getTryOutInterfaces('applications/public/app__1.0.0');

    expect(coreUtilityApi.getDeploymentInfoResult).toHaveBeenCalledWith('applications/public/app__1.0.0', TOKEN_MOCK);
  });

  test('returns the interfaces Core reports', async () => {
    vi.mocked(coreUtilityApi.getDeploymentInfoResult).mockResolvedValue({
      success: true,
      response: { interfaces: ['chat', 'openaiResponses'] },
    } as never);

    expect(await getTryOutInterfaces('gpt')).toEqual({ interfaces: ['chat', 'openaiResponses'] });
  });

  test('returns no interfaces when Core reports none', async () => {
    vi.mocked(coreUtilityApi.getDeploymentInfoResult).mockResolvedValue({ success: true, response: {} } as never);

    expect(await getTryOutInterfaces('gpt')).toEqual({ interfaces: [] });
  });

  test.each([
    [403, TryOutFailureKind.NoAccess],
    [404, TryOutFailureKind.NotFound],
    [500, TryOutFailureKind.Server],
    [400, TryOutFailureKind.Rejected],
  ])('classifies a %s answer with its status', async (status, kind) => {
    vi.mocked(coreUtilityApi.getDeploymentInfoResult).mockResolvedValue({ success: false, status } as never);

    expect(await getTryOutInterfaces('gpt')).toEqual({ failure: { kind, status } });
  });

  test('reports a network failure when the answer has no status', async () => {
    vi.mocked(coreUtilityApi.getDeploymentInfoResult).mockResolvedValue({ success: false, status: 0 } as never);

    expect(await getTryOutInterfaces('gpt')).toEqual({ failure: { kind: TryOutFailureKind.Network } });
  });

  test('reports a network failure when Core cannot be reached', async () => {
    vi.mocked(coreUtilityApi.getDeploymentInfoResult).mockRejectedValue(new Error('down'));

    expect(await getTryOutInterfaces('gpt')).toEqual({ failure: { kind: TryOutFailureKind.Network } });
  });
});
