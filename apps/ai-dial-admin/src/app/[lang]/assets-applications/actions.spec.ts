import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ErrorI18nKey } from '@/src/constants/i18n';

import {
  adminConsentApi,
  assetApi,
  configFileApi,
  externalServiceConsentApi,
  externalServiceOpsApi,
  toolsetOpsApi,
} from '@/src/app/api/api';
import * as eximModule from '@/src/server/applications/exim';
import * as zipEximModule from '@/src/server/applications/zip-exim';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  getApps,
  removeApp,
  moveApps,
  bulkDeleteApps,
  getApp,
  updateApp,
  createApp,
  importApps,
  exportApps,
  getAssetTools,
  getConfigFileApplication,
  getConfigFileApplications,
  signInExternalService,
  signOutExternalService,
  grantExternalServiceConsent,
  withdrawExternalServiceConsent,
  getAdminConsentStatus,
  grantAdminConsent,
  withdrawAdminConsent,
} from './actions';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ResourceType } from '@/src/types/resource-type';
import { ImportFileType } from '@/src/types/import';
import { DialApplicationResource } from '@/src/models/dial/resource';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/applications/exim');
vi.mock('@/src/server/applications/zip-exim');

const resourceBase = {
  created_at: 0,
  updated_at: 0,
  description_keywords: [],
  dependencies: [],
  interceptors: [],
  icon_url: '',
  reference: 'ref',
  max_retry_attempts: 0,
  forward_auth_token: false,
};

// `DialApplicationResource` requires the whole Core payload; the tests care about a handful of members,
// so the factory carries the rest and the payload assertions match on what each case is about.
// A fetched entity carries its identity grafts under `_metadata` (the merge layer's contract) while
// the update flow resolves `folderId`/`version` flat via `getEntityForUpdate` — the factory sets both
// spellings so either resolution path is exercised.
const appResource = (overrides: Partial<DialApplicationResource> = {}): DialApplicationResource => ({
  ...resourceBase,
  name: 'my-app',
  folderId: 'public/',
  version: '1.0',
  display_version: 'Spring release',
  input_attachment_types: [],
  application_properties: {},
  _metadata: {
    name: 'my-app',
    path: 'public/my-app__1.0',
    folderId: 'public/',
    version: '1.0',
    nodeType: DialFileNodeType.ITEM,
  },
  ...overrides,
});

describe('Assets application :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getApps action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getApps('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('creates a text version and synchronizes display_version without a semver requirement', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);
    await createApp(appResource({ version: 'release candidate', display_version: 'independent old value' }));
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__release candidate',
      expect.objectContaining({ display_version: 'release candidate', displayVersion: undefined }),
    );
  });

  test.each([
    ['', ErrorI18nKey.RequiredField],
    ['bad__version', ErrorI18nKey.AmbiguousAssetVersion],
    ['_preview', ErrorI18nKey.AmbiguousAssetVersion],
    ['bad/version', ErrorI18nKey.InvalidAssetPath],
    ['preview.', ErrorI18nKey.InvalidAssetPath],
    ['a'.repeat(900), ErrorI18nKey.AssetPathTooLong],
  ])(
    'returns a localized validation response for invalid creation version %s before Core',
    async (version, errorMessage) => {
      const result = await createApp(appResource({ version }));

      expect(result).toEqual({ success: false, errorHeader: ErrorI18nKey.ValidationError, errorMessage });
      expect(assetApi.put).not.toHaveBeenCalled();
    },
  );

  test('creates a public application with a 255-character combined name and version', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);
    const name = 'a'.repeat(100);
    const version = 'b'.repeat(153);
    const result = await createApp(appResource({ name, version }));
    expect(result).toBe(RESPONSE_MOCK);
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      `public/${name}__${version}`,
      expect.objectContaining({ display_version: version }),
    );
  });

  test.each([154, 160])('rejects an oversized combined application identity with version length %s', async (length) => {
    const result = await createApp(appResource({ name: 'a'.repeat(100), version: 'b'.repeat(length) }));
    expect(result).toEqual({
      success: false,
      errorHeader: ErrorI18nKey.ValidationError,
      errorMessage: ErrorI18nKey.AssetNameVersionTooLong,
    });
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test('keeps platform application creation unversioned at the name length limit', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);
    const name = 'a'.repeat(255);
    const result = await createApp(appResource({ name, folderId: 'platform/', version: '', _metadata: undefined }));
    expect(result).toBe(RESPONSE_MOCK);
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      `platform/${name}`,
      expect.anything(),
    );
  });

  test('preserves oversized legacy application identity during ordinary updates', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);
    const name = 'a'.repeat(100);
    const version = 'b'.repeat(160);
    const path = `public/${name}__${version}`;
    const result = await updateApp(
      appResource({ name, version, _metadata: { name, version, path, folderId: 'public/' } }),
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, path, expect.anything(), {
      etag: 'etag',
    });
  });

  test('ordinary updates preserve empty display version and original metadata identity', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);
    await updateApp(appResource({ version: 'forged', display_version: '' }), 'etag');
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.objectContaining({ display_version: '' }),
      { etag: 'etag' },
    );
  });

  test('Should call getApp action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue({
      success: true,
      response: { name: 'app', path: 'app-path' },
      etag: 'e1',
    });

    const result = await getApp('app-path', 'etag');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'app-path', 'etag');
    expect(result.response?.validityState).toBeUndefined();
  });

  test('Should call importApps action for JSON import and delegate to importApplicationsExport', async () => {
    (eximModule.importApplicationsExport as any).mockResolvedValue({ importResults: [{ status: 'success' }] });

    const document = { applications: [{ id: 'applications/public/name__1.0' }] };
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'override' })]));
    body.append('file', new Blob([JSON.stringify(document)]));

    const result = await importApps(body, ImportFileType.JSON);

    expect(getUserToken).toHaveBeenCalled();
    expect(eximModule.importApplicationsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, document, {
      path: 'public/',
      conflictResolutionStrategy: 'override',
      flatImport: undefined,
    });
    expect(result).toEqual({ success: true, response: { importResults: [{ status: 'success' }] } });
  });

  test('importApps extracts a zip archive before delegating', async () => {
    (zipEximModule.extractApplicationsFromZip as any).mockResolvedValue({ applications: [] });
    (eximModule.importApplicationsExport as any).mockResolvedValue({ importResults: [] });

    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'skip' })]));
    body.append('file', new Blob(['zip-bytes']));

    const result = await importApps(body, ImportFileType.ARCHIVE);

    expect(zipEximModule.extractApplicationsFromZip).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  test('importApps rejects when the config part is missing', async () => {
    const result = await importApps(new FormData(), ImportFileType.JSON);

    expect(result.success).toBe(false);
  });

  test('Should call exportApps action for JSON export', async () => {
    (eximModule.buildApplicationsExport as any).mockResolvedValue({ applications: [] });

    const result = await exportApps(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(eximModule.buildApplicationsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ['test']);
    expect(zipEximModule.buildApplicationsZip).not.toHaveBeenCalled();
    expect(result).toEqual({ applications: [] });
  });

  test('exportApps wraps the document as a zip for archive export', async () => {
    (eximModule.buildApplicationsExport as any).mockResolvedValue({ applications: [] });
    const blob = new Blob(['zip']);
    (zipEximModule.buildApplicationsZip as any).mockResolvedValue(blob);

    const result = await exportApps(['test'], ImportFileType.ARCHIVE);

    expect(zipEximModule.buildApplicationsZip).toHaveBeenCalledWith({ applications: [] });
    expect(result).toEqual({ blob, fileName: 'applications-export.zip' });
  });

  test('Should call updateApp action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApp(
      appResource({
        folderId: 'public',
        application_properties: { key: 'value' },
        defaults: { key: 'value' },
        version: '1.0',
      }),
      'etag',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.objectContaining({
        folderId: undefined,
        application_properties: { key: 'value' },
        defaults: { key: 'value' },
        version: undefined,
        source: undefined,
        display_version: 'Spring release',
      }),
      { etag: 'etag' },
    );
    // The whole `_metadata` graft — identity and `nodeType` alike — is deleted before Core sees the
    // body. `objectContaining` treats an absent key as unequal to `undefined`, so absence is asserted
    // with the negative matcher instead.
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.not.objectContaining({ _metadata: expect.anything(), nodeType: expect.anything() }),
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('updateApp sends no client_secret_hint or empty client_secret for external services', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateApp(
      appResource({
        folderId: 'public',
        version: '1.0',
        external_services: {
          untouched: { auth_settings: { client_id: 'id', client_secret: '', client_secret_hint: 'cret' } },
          retyped: { auth_settings: { client_id: 'id', client_secret: 'typed-secret', client_secret_hint: 'cret' } },
        },
      }),
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.objectContaining({
        external_services: {
          untouched: { auth_settings: { client_id: 'id' } },
          retyped: { auth_settings: { client_id: 'id', client_secret: 'typed-secret' } },
        },
      }),
      { etag: 'etag' },
    );
  });

  test('updateApp passes interfaces through unchanged before calling Core', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateApp(
      appResource({
        folderId: 'public',
        version: '1.0',
        interfaces: { openaiChatCompletions: { base_url: 'https://example.com' } },
      }),
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.objectContaining({
        interfaces: { openaiChatCompletions: { base_url: 'https://example.com' } },
      }),
      { etag: 'etag' },
    );
  });

  test('updateApp rejects an out-of-range maxInputAttachments before calling Core', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApp(
      appResource({
        folderId: 'public',
        version: '1.0',
        max_input_attachments: 2000,
      }),
      'etag',
    );

    expect(result.success).toBe(false);
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test('Should call createApp action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApp(
      appResource({
        folderId: 'public',
        version: '1.0',
      }),
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.objectContaining({
        folderId: undefined,
        version: undefined,
        source: undefined,
        display_version: '1.0',
        application_type_schema_id: undefined,
      }),
    );
    // See the `updateApp` case for why absence of the `_metadata` graft needs the negative matcher.
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.not.objectContaining({ _metadata: expect.anything(), nodeType: expect.anything() }),
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createApp keeps a non-empty interface entry when calling Core', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createApp(
      appResource({
        folderId: 'public',
        version: '1.0',
        interfaces: { openaiChatCompletions: { base_url: 'https://example.com' } },
      }),
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'public/my-app__1.0',
      expect.objectContaining({
        interfaces: { openaiChatCompletions: { base_url: 'https://example.com' } },
      }),
    );
  });

  test('createApp rejects an invalid viewerUrl before calling Core', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApp(
      appResource({
        folderId: 'public',
        version: '1.0',
        viewer_url: 'https://exa mple.com',
      }),
    );

    expect(result.success).toBe(false);
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test('createApp conflict surfaces a recognizable error', async () => {
    (assetApi.put as any).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'Application already exists',
    });

    const result = await createApp(
      appResource({
        folderId: 'public',
        version: '1.0',
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Application already exists');
  });

  test('Should call removeApp action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeApp('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'test', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('removeApp without an etag calls the Core client unconditionally', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removeApp('test');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'test', undefined);
  });

  test('Should call moveApps action', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await moveApps(['folder/path'], 'newFolder/');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'folder/path',
      'newFolder//path',
      undefined,
    );
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('moveApps with duplicateName keeps the source version suffix on the destination', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    await moveApps(['folder/name__2'], 'folder/', false, 'copy');

    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'folder/name__2',
      'folder//copy__2',
      false,
    );
  });

  test('Should call bulkDeleteApps action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteApps([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'path');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteApps stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (assetApi.delete as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeleteApps([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });

  test('Should call getAssetTools action for APPLICATION resource type', async () => {
    (toolsetOpsApi.discoveredTools as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAssetTools('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(toolsetOpsApi.discoveredTools).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.APPLICATION);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('signInExternalService URL-encodes each path segment of a spaced app path', async () => {
    (externalServiceOpsApi.signIn as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signInExternalService(
      'public/als code apps/my-app',
      'test-service',
      'APPLICATION',
      'API_KEY',
      undefined,
      'api-key-value',
    );

    expect(getUserToken).toHaveBeenCalled();
    expect(externalServiceOpsApi.signIn).toHaveBeenCalledWith(TOKEN_MOCK, {
      url: 'applications/public/als%20code%20apps/my-app/external_services/test-service',
      credentialsLevel: 'APPLICATION',
      authenticationType: 'API_KEY',
      offline_usage_consent: true,
      apiKey: 'api-key-value',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('signOutExternalService URL-encodes each path segment of a spaced app path', async () => {
    (externalServiceOpsApi.signOut as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signOutExternalService('public/als code apps/my-app', 'test-service', 'USER', 'API_KEY');

    expect(getUserToken).toHaveBeenCalled();
    expect(externalServiceOpsApi.signOut).toHaveBeenCalledWith(TOKEN_MOCK, {
      url: 'applications/public/als%20code%20apps/my-app/external_services/test-service',
      credentialsLevel: 'USER',
      authenticationType: 'API_KEY',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call grantExternalServiceConsent action', async () => {
    (externalServiceConsentApi.grant as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await grantExternalServiceConsent('public/my-app', 'dial');

    expect(getUserToken).toHaveBeenCalled();
    expect(externalServiceConsentApi.grant).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-app', 'dial');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call withdrawExternalServiceConsent action', async () => {
    (externalServiceConsentApi.withdraw as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await withdrawExternalServiceConsent('public/als code apps/my app', 'dial');

    expect(getUserToken).toHaveBeenCalled();
    expect(externalServiceConsentApi.withdraw).toHaveBeenCalledWith(TOKEN_MOCK, 'public/als code apps/my app', 'dial');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getAdminConsentStatus action', async () => {
    (adminConsentApi.getStatus as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAdminConsentStatus('public/my-app');

    expect(getUserToken).toHaveBeenCalled();
    expect(adminConsentApi.getStatus).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-app');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call grantAdminConsent action', async () => {
    (adminConsentApi.grant as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await grantAdminConsent('public/my-app');

    expect(getUserToken).toHaveBeenCalled();
    expect(adminConsentApi.grant).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-app');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call withdrawAdminConsent action', async () => {
    (adminConsentApi.withdraw as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await withdrawAdminConsent('public/my-app');

    expect(getUserToken).toHaveBeenCalled();
    expect(adminConsentApi.withdraw).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-app');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getConfigFileApplications action', async () => {
    (configFileApi.listNames as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConfigFileApplications();

    expect(getUserToken).toHaveBeenCalled();
    expect(configFileApi.listNames).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Applications);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getConfigFileApplication action', async () => {
    (configFileApi.getEntity as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConfigFileApplication('my-app');

    expect(getUserToken).toHaveBeenCalled();
    expect(configFileApi.getEntity).toHaveBeenCalledWith(TOKEN_MOCK, ConfigFileEntityType.Applications, 'my-app');
    expect(result).toBe(RESPONSE_MOCK);
  });
});
