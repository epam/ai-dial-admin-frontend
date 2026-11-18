import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AssetApi } from '@/src/server/core/asset-api';
import { ConfigFileApi } from '@/src/server/core/config-file-api';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { isDeploymentNameTaken } from '../name-clash';

const rows = (...names: string[]) => names.map((name) => ({ name }));

describe('Server :: aliases :: isDeploymentNameTaken', () => {
  const list = vi.fn();
  const listNames = vi.fn();
  const check = (name: string) =>
    isDeploymentNameTaken({ list } as unknown as AssetApi, { listNames } as unknown as ConfigFileApi, TOKEN_MOCK, name);

  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue([]);
    listNames.mockResolvedValue({ success: true, data: [] });
  });

  test('is false when no deployment type holds the name', async () => {
    expect(await check('free')).toBe(false);
  });

  test.each([
    ResourceType.MODEL,
    ResourceType.APPLICATION,
    ResourceType.TOOLSET,
    ResourceType.INTERCEPTOR,
    ResourceType.ROUTER,
    ResourceType.ALIAS,
  ])('is true when a platform %s has the name', async (type) => {
    list.mockImplementation(async (_token, resource) => (resource === type ? rows('taken') : []));

    expect(await check('taken')).toBe(true);
  });

  test.each([
    ConfigFileEntityType.Models,
    ConfigFileEntityType.Applications,
    ConfigFileEntityType.Toolsets,
    ConfigFileEntityType.Interceptors,
    ConfigFileEntityType.Routers,
    ConfigFileEntityType.Aliases,
  ])('is true when the config file declares the name under %s', async (type) => {
    listNames.mockImplementation(async (_token, configType) => ({
      success: true,
      data: configType === type ? ['taken'] : [],
    }));

    expect(await check('taken')).toBe(true);
  });

  test('reads the platform bucket only', async () => {
    await check('x');

    expect(list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.MODEL, 'platform/');
  });

  test('a failed read is not a clash', async () => {
    list.mockRejectedValue(new Error('boom'));
    listNames.mockResolvedValue({ success: false, failure: { reason: 'RequestFailed' } });

    expect(await check('x')).toBe(false);
  });
});
