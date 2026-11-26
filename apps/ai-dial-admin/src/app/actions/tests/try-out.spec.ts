import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTryOutInterfaces } from '@/src/app/actions/try-out';
import { coreUtilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api', () => ({ coreUtilityApi: { checkDeploymentByName: vi.fn() } }));
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');

describe('getTryOutInterfaces', () => {
  beforeEach(() => {
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
  });

  test("looks the deployment up with the signed-in admin's token", async () => {
    vi.mocked(coreUtilityApi.checkDeploymentByName).mockResolvedValue({ interfaces: ['chat'] } as never);

    await getTryOutInterfaces('applications/public/app__1.0.0');

    expect(coreUtilityApi.checkDeploymentByName).toHaveBeenCalledWith('applications/public/app__1.0.0', TOKEN_MOCK);
  });

  test('returns the interfaces Core reports', async () => {
    vi.mocked(coreUtilityApi.checkDeploymentByName).mockResolvedValue({
      interfaces: ['chat', 'openaiResponses'],
    } as never);

    expect(await getTryOutInterfaces('gpt')).toEqual(['chat', 'openaiResponses']);
  });

  test.each([
    ['the deployment is not found', null],
    ['Core did not answer', undefined],
    ['Core reports no interfaces field', {}],
  ])('returns null when %s', async (_name, deployment) => {
    vi.mocked(coreUtilityApi.checkDeploymentByName).mockResolvedValue(deployment as never);

    expect(await getTryOutInterfaces('gpt')).toBeNull();
  });
});
