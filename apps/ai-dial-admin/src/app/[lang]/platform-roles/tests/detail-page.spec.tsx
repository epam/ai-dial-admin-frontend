import { ReactElement, ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/platform-roles/[id]/page';
import * as roleActions from '@/src/app/[lang]/platform-roles/actions';
import RoleAssetView from '@/src/components/Assets/Platform/Roles/View';
import Page403 from '@/src/components/Page403/Page403';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialRoleResource } from '@/src/models/dial/resource';
import * as pageOptions from '@/src/server/config-entities/read-page-options';
import { ConfigFileFailureReason } from '@/src/types/config-file-entity';
import * as auth from '@/src/utils/auth/auth-request';
import * as authToggle from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const ROLE_NAME = 'role %2F & more';
const platformRole: DialRoleResource = {
  name: ROLE_NAME,
  _metadata: { name: ROLE_NAME, path: ROLE_NAME, folderId: '' },
};
const fileRole = { name: ROLE_NAME, description: '' };
const platform404 = { success: false, status: 404 };
const fileFailure = (status?: number) => ({
  success: false as const,
  failure: { reason: ConfigFileFailureReason.RequestFailed, status },
});

const getRole = vi.spyOn(roleActions, 'getRole');
const getConfigFileRole = vi.spyOn(roleActions, 'getConfigFileRole');
const getToken = vi.spyOn(auth, 'getUserToken');
const getAuthToggle = vi.spyOn(authToggle, 'getIsEnableAuthToggle');
const readOptions = vi.spyOn(pageOptions, 'readConfigEntities');

const openPage = (isConfigFile = false) =>
  Page({
    params: Promise.resolve({ id: ROLE_NAME }),
    searchParams: Promise.resolve({ configFile: isConfigFile ? 'true' : undefined }),
  });

const roleViewProps = (page: Awaited<ReturnType<typeof Page>>) => {
  const child = page.props.children as ReactElement<ComponentProps<typeof RoleAssetView>>;
  return child.props;
};

describe('platform role detail page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getToken.mockResolvedValue(TOKEN_MOCK);
    getAuthToggle.mockReturnValue(true);
    readOptions.mockResolvedValue([]);
  });

  test('renders the platform role with its etag without reading the file population', async () => {
    getRole.mockResolvedValue({ success: true, response: platformRole, etag: 'role-etag' });

    const page = await openPage();

    expect(getRole).toHaveBeenCalledWith(ROLE_NAME, DEFAULT_ETAG);
    expect(getConfigFileRole).not.toHaveBeenCalled();
    expect(roleViewProps(page)).toMatchObject({
      originalRole: platformRole,
      etag: 'role-etag',
      isConfigFileSource: false,
    });
  });

  test('falls back to a file role after a confirmed platform 404', async () => {
    getRole.mockResolvedValue(platform404);
    getConfigFileRole.mockResolvedValue({ success: true, data: fileRole });

    const page = await openPage();

    expect(getConfigFileRole).toHaveBeenCalledWith(ROLE_NAME);
    expect(roleViewProps(page)).toMatchObject({
      originalRole: fileRole,
      etag: DEFAULT_ETAG,
      isConfigFileSource: true,
    });
  });

  test('opens an explicitly requested file role without reading a same-name platform role', async () => {
    getConfigFileRole.mockResolvedValue({ success: true, data: fileRole });

    const page = await openPage(true);

    expect(getRole).not.toHaveBeenCalled();
    expect(getConfigFileRole).toHaveBeenCalledWith(ROLE_NAME);
    expect(roleViewProps(page)).toMatchObject({ originalRole: fileRole, isConfigFileSource: true });
  });

  test('reports not found only when both populations return 404', async () => {
    getRole.mockResolvedValue(platform404);
    getConfigFileRole.mockResolvedValue(fileFailure(404));

    await expect(openPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(readOptions).not.toHaveBeenCalled();
  });

  test('reports an explicitly requested absent file role as not found', async () => {
    getConfigFileRole.mockResolvedValue(fileFailure(404));

    await expect(openPage(true)).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getRole).not.toHaveBeenCalled();
  });

  test.each([401, 403])('shows access denied for platform status %i without trying a file role', async (status) => {
    getRole.mockResolvedValue({ success: false, status });

    const page = await openPage();

    expect(page.type).toBe(Page403);
    expect(getConfigFileRole).not.toHaveBeenCalled();
    expect(readOptions).not.toHaveBeenCalled();
  });

  test.each([401, 403])('shows access denied for file status %i after a platform 404', async (status) => {
    getRole.mockResolvedValue(platform404);
    getConfigFileRole.mockResolvedValue(fileFailure(status));

    expect((await openPage()).type).toBe(Page403);
    expect(readOptions).not.toHaveBeenCalled();
  });

  test('shows access denied for an explicit file lookup', async () => {
    getConfigFileRole.mockResolvedValue(fileFailure(403));

    expect((await openPage(true)).type).toBe(Page403);
    expect(getRole).not.toHaveBeenCalled();
  });

  test.each([500, 0, undefined])('treats platform status %s as an error without fallback', async (status) => {
    getRole.mockResolvedValue({ success: false, status, errorMessage: 'Resource metadata not found' });

    await expect(openPage()).rejects.toThrow('Failed to fetch role asset data');
    expect(getConfigFileRole).not.toHaveBeenCalled();
  });

  test.each([500, 0, undefined])('treats file status %s as an error after platform absence', async (status) => {
    getRole.mockResolvedValue(platform404);
    getConfigFileRole.mockResolvedValue(fileFailure(status));

    await expect(openPage()).rejects.toThrow('Failed to fetch config-file role data');
  });

  test('does not fall back on malformed successful platform data', async () => {
    getRole.mockResolvedValue({ success: true });

    await expect(openPage()).rejects.toThrow('Failed to fetch role asset data');
    expect(getConfigFileRole).not.toHaveBeenCalled();
  });

  test('does not fall back when a successful platform response lacks metadata', async () => {
    getRole.mockResolvedValue({ success: true, response: { name: ROLE_NAME } });

    await expect(openPage()).rejects.toThrow('Failed to fetch role asset data');
    expect(getConfigFileRole).not.toHaveBeenCalled();
  });

  test('treats malformed successful file data as an error', async () => {
    getRole.mockResolvedValue(platform404);
    getConfigFileRole.mockResolvedValue({ success: true, data: null as never });

    await expect(openPage()).rejects.toThrow('Failed to fetch config-file role data');
  });

  test('does not fall back when the platform request throws', async () => {
    getRole.mockRejectedValue(new Error('upstream secret'));

    await expect(openPage()).rejects.toThrow('Failed to fetch role asset data');
    expect(getConfigFileRole).not.toHaveBeenCalled();
  });

  test('does not expose an exception from the file request', async () => {
    getRole.mockResolvedValue(platform404);
    getConfigFileRole.mockRejectedValue(new Error('upstream secret'));

    await expect(openPage()).rejects.toThrow('Failed to fetch config-file role data');
  });

  test('passes model option warnings through to the role view', async () => {
    getRole.mockResolvedValue({ success: true, response: platformRole });
    readOptions.mockImplementation(async (_token, _type, warnings) => {
      warnings.push(EntitiesI18nKey.NoRoles);
      return [];
    });

    expect(roleViewProps(await openPage()).optionWarnings).toEqual([EntitiesI18nKey.NoRoles]);
  });
});
