import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, configFileApi, coreUtilityApi } from '@/src/app/api/api';
import { AliasPresentAs } from '@/src/models/dial/alias';
import { isDeploymentNameTaken } from '@/src/server/aliases/name-clash';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteAliases,
  createAlias,
  getAlias,
  getAliasHealthIssue,
  getAliases,
  getConfigFileAlias,
  getConfigFileAliases,
  removeAlias,
  updateAlias,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/aliases/name-clash');

const TARGET = { path: 'models/gpt' };

describe('Assets aliases :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
    (isDeploymentNameTaken as any).mockResolvedValue(false);
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);
  });

  test('getAliases lists one bucket', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    expect(await getAliases('platform/')).toBe(RESPONSE_MOCK);
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ALIAS, 'platform/');
  });

  test('getAlias reads the merged alias with its etag', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    expect(await getAlias('public/search', 'etag')).toBe(RESPONSE_MOCK);
    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ALIAS, 'public/search', 'etag');
  });

  describe('createAlias', () => {
    test('writes a platform alias at platform/<name> without overwrite and with only the accepted fields', async () => {
      await createAlias({
        name: 'assistant-v1',
        folderId: 'platform/',
        target: TARGET,
        displayName: 'Assistant',
        _metadata: { name: 'x', path: 'platform/x', folderId: 'platform/' },
      });

      expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ALIAS, 'platform/assistant-v1', {
        target: TARGET,
        displayName: 'Assistant',
      });
    });

    test('defaults to the public bucket, where the URL is the name', async () => {
      await createAlias({ name: 'search', target: TARGET });

      expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ALIAS, 'public/search', { target: TARGET });
    });

    test('does not pre-check the name of a public alias against the deployment namespace', async () => {
      (isDeploymentNameTaken as any).mockResolvedValue(true);

      await createAlias({ name: 'gpt-4-internal', folderId: 'public/', target: TARGET });

      expect(isDeploymentNameTaken).not.toHaveBeenCalled();
      expect(assetApi.put).toHaveBeenCalled();
    });

    test('refuses a platform name already used by a deployment before any write', async () => {
      (isDeploymentNameTaken as any).mockResolvedValue(true);

      const result = await createAlias({ name: 'gpt-4-internal', folderId: 'platform/', target: TARGET });

      expect(isDeploymentNameTaken).toHaveBeenCalledWith(assetApi, configFileApi, TOKEN_MOCK, 'gpt-4-internal');
      expect(assetApi.put).not.toHaveBeenCalled();
      expect(result).toMatchObject({ success: false });
    });

    test.each(['team/assistant', 'with space', '', 'a:b'])('refuses the name "%s" before any request', async (name) => {
      const result = await createAlias({ name, folderId: 'platform/', target: TARGET });

      expect(result).toMatchObject({ success: false });
      expect(isDeploymentNameTaken).not.toHaveBeenCalled();
      expect(assetApi.put).not.toHaveBeenCalled();
    });

    test('passes the rejection of Core through', async () => {
      const rejection = { success: false, errorHeader: 'Bad Request', errorMessage: 'target.path: missing' };
      (assetApi.put as any).mockResolvedValue(rejection);

      expect(await createAlias({ name: 'a', target: TARGET })).toBe(rejection);
    });
  });

  test('updateAlias writes at the merged path with the etag and without the merge graft', async () => {
    await updateAlias(
      {
        target: TARGET,
        presentAs: AliasPresentAs.Application,
        _metadata: { name: 'a', path: 'platform/a', folderId: 'platform/' },
      },
      'etag-1',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.ALIAS,
      'platform/a',
      { target: TARGET, presentAs: AliasPresentAs.Application },
      { etag: 'etag-1' },
    );
  });

  test('removeAlias deletes only the alias', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removeAlias('public/search', 'etag');

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ALIAS, 'public/search', 'etag');
  });

  test('bulkDeleteAliases deletes each path as an alias', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    await bulkDeleteAliases([{ path: 'platform/a' }, { path: 'public/b' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ALIAS, 'platform/a');
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ALIAS, 'public/b');
  });

  test('reads the config-file aliases', async () => {
    (configFileApi.listNames as any).mockResolvedValue(RESPONSE_MOCK);
    (configFileApi.getEntity as any).mockResolvedValue(RESPONSE_MOCK);

    await getConfigFileAliases();
    await getConfigFileAlias('assistant-v1');

    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Aliases);
    expect(configFileApi.getEntity).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Aliases, 'assistant-v1');
  });

  describe('getAliasHealthIssue', () => {
    const health = (skipped: { id: string; reason: string }[]) => ({
      success: true,
      response: { status: skipped.length ? 'degraded' : 'ok', skipped },
    });

    test('asks Core for its health with the token of the caller', async () => {
      (coreUtilityApi.getConfigHealth as any).mockResolvedValue(health([]));

      await getAliasHealthIssue('assistant-v1', false);

      expect(coreUtilityApi.getConfigHealth).toHaveBeenCalledWith(TOKEN_MOCK);
    });

    test('finds the entry of a platform alias by its bare id', async () => {
      const entry = { id: 'aliases/assistant-v1', reason: 'alias_target_missing' };
      (coreUtilityApi.getConfigHealth as any).mockResolvedValue(health([entry]));

      expect(await getAliasHealthIssue('assistant-v1', false)).toEqual(entry);
    });

    test('finds the entry of a public alias by its URL and not that of a platform alias of the same name', async () => {
      const publicEntry = { id: 'aliases/public/search', reason: 'alias_target_incompatible' };
      (coreUtilityApi.getConfigHealth as any).mockResolvedValue(
        health([{ id: 'aliases/search', reason: 'alias_target_missing' }, publicEntry]),
      );

      expect(await getAliasHealthIssue('search', true)).toEqual(publicEntry);
    });

    test('is no issue for a healthy alias', async () => {
      (coreUtilityApi.getConfigHealth as any).mockResolvedValue(health([]));

      expect(await getAliasHealthIssue('assistant-v1', false)).toBeUndefined();
    });

    test('is no issue when the report could not be read, rather than claiming something Core did not say', async () => {
      (coreUtilityApi.getConfigHealth as any).mockResolvedValue({ success: false, errorHeader: 'Forbidden' });

      expect(await getAliasHealthIssue('assistant-v1', false)).toBeUndefined();
    });
  });
});
