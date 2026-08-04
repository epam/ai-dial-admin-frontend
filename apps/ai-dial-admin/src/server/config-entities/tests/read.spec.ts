import { beforeEach, describe, expect, test, vi } from 'vitest';

import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { ConfigEntityOrigin, ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';

const getMetadata = vi.fn();
const listNames = vi.fn();
const getEntity = vi.fn();
const globalSettings = vi.fn();

vi.mock('@/src/app/api/api', () => ({
  assetApi: { getMetadata: (...args: unknown[]) => getMetadata(...args) },
  configFileApi: {
    listNames: (...args: unknown[]) => listNames(...args),
    getEntity: (...args: unknown[]) => getEntity(...args),
  },
  settingsApi: { globalSettings: (...args: unknown[]) => globalSettings(...args) },
}));

const { getConfigEntityOptions, getGlobalInterceptors } = await import('@/src/server/config-entities/read');

const metadataPage = (names: string[], nextToken?: string) => ({
  items: names.map((name) => ({ name })),
  nextToken,
});

describe('getConfigEntityOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('unions both populations with their origins', async () => {
    getMetadata.mockResolvedValue(metadataPage(['from-api']));
    listNames.mockResolvedValue({ success: true, data: ['from-file'] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success && result.data.options).toEqual([
      { name: 'from-file', origin: ConfigEntityOrigin.ConfigFile },
      { name: 'from-api', origin: ConfigEntityOrigin.Api },
    ]);
    expect(result.success && result.data.failures).toEqual([]);
  });

  test('follows the metadata listing across pages', async () => {
    getMetadata.mockResolvedValueOnce(metadataPage(['one'], 'token-2')).mockResolvedValueOnce(metadataPage(['two']));
    listNames.mockResolvedValue({ success: true, data: [] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Roles);

    expect(getMetadata).toHaveBeenCalledTimes(2);
    expect(result.success && result.data.options.map((option) => option.name)).toEqual(['one', 'two']);
  });

  // `getMetadata` returns null for 403/404/500 alike, so null must become a reported failure rather
  // than an empty population — otherwise a refusal is indistinguishable from "none defined".
  test('treats a null metadata response as a failure, not an empty population', async () => {
    getMetadata.mockResolvedValue(null);
    listNames.mockResolvedValue({ success: true, data: ['from-file'] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success && result.data.options).toEqual([
      { name: 'from-file', origin: ConfigEntityOrigin.ConfigFile },
    ]);
    expect(result.success && result.data.failures).toHaveLength(1);
    expect(result.success && result.data.failures[0].errorMessage).toContain('interceptors');
  });

  test('an empty metadata listing is a success, not a failure', async () => {
    getMetadata.mockResolvedValue(metadataPage([]));
    listNames.mockResolvedValue({ success: true, data: [] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success && result.data.options).toEqual([]);
    expect(result.success && result.data.failures).toEqual([]);
  });

  // A throw must not escape: the caller's own catch cannot tell which population failed, so one bad
  // body would empty both pickers with nothing reported.
  test('contains a throw from either read as a reported failure', async () => {
    getMetadata.mockRejectedValue(new Error('socket hang up'));
    listNames.mockResolvedValue({ success: true, data: ['survivor'] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success && result.data.options.map((option) => option.name)).toEqual(['survivor']);
    expect(result.success && result.data.failures[0].errorMessage).toContain('socket hang up');
  });

  test('reports a failure when both reads fail', async () => {
    getMetadata.mockResolvedValue(null);
    listNames.mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, status: 403 },
    });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success).toBe(false);
  });

  test('does not survive a non-array items body by silently returning nothing', async () => {
    getMetadata.mockResolvedValue({ items: { one: {} } });
    listNames.mockResolvedValue({ success: true, data: [] });

    const result = await getConfigEntityOptions(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    // No throw, and the malformed page contributes no names.
    expect(result.success && result.data.options).toEqual([]);
  });
});

describe('getGlobalInterceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Not a union: Core's settings overlay has the API blob replace the file value outright.
  test('uses the API-written blob when it exists, without reading the file entry', async () => {
    globalSettings.mockResolvedValue({ success: true, response: { globalInterceptors: ['from-blob'] } });

    const result = await getGlobalInterceptors(TOKEN_MOCK);

    expect(result.success && result.data).toEqual(['from-blob']);
    expect(getEntity).not.toHaveBeenCalled();
  });

  test('falls back to the config-file entry when no blob exists', async () => {
    globalSettings.mockResolvedValue({ success: false, status: 404 });
    getEntity.mockResolvedValue({ success: true, data: { globalInterceptors: ['from-file'] } });

    const result = await getGlobalInterceptors(TOKEN_MOCK);

    expect(result.success && result.data).toEqual(['from-file']);
  });

  test('reports a non-404 blob failure rather than falling back', async () => {
    globalSettings.mockResolvedValue({ success: false, status: 500, errorMessage: 'boom' });

    const result = await getGlobalInterceptors(TOKEN_MOCK);

    expect(result.success).toBe(false);
    expect(getEntity).not.toHaveBeenCalled();
  });

  test('reports a forbidden file read rather than passing it off as no global chain', async () => {
    globalSettings.mockResolvedValue({ success: false, status: 404 });
    getEntity.mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed, status: 403 },
    });

    const result = await getGlobalInterceptors(TOKEN_MOCK);

    expect(result.success).toBe(false);
  });

  test('treats a blob with no globalInterceptors field as an empty chain', async () => {
    globalSettings.mockResolvedValue({ success: true, response: {} });

    const result = await getGlobalInterceptors(TOKEN_MOCK);

    expect(result.success && result.data).toEqual([]);
  });
});
