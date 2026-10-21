import { beforeEach, describe, expect, test, vi } from 'vitest';

import { settingsApi } from '@/src/app/api/api';
import Page from '@/src/app/[lang]/system-properties/page';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/config-entities/read-page-options');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

// The page wraps `SystemProperties` in `SaveValidationContextProvider`, so its props (the data under
// test) sit one level down, on the child element.
const renderPage = async () => {
  const page = (await Page()) as { props: { children: { props: Record<string, unknown> } } };
  return page.props.children.props;
};

describe('system properties page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
    vi.mocked(readConfigEntities).mockResolvedValue([]);
  });

  test('reports no settings blob without a warning when the read 404s', async () => {
    vi.mocked(settingsApi.getSystemProperties).mockResolvedValue({ success: false, status: 404 });

    const page = await renderPage();

    expect(page).toMatchObject({ globalSettings: null, doesSettingsExist: false, optionWarnings: [] });
  });

  test('reports the existing settings and marks the blob as existing on a successful read', async () => {
    const globalSettings = { globalInterceptors: ['interceptor-1'] };
    vi.mocked(settingsApi.getSystemProperties).mockResolvedValue({ success: true, response: globalSettings });

    const page = await renderPage();

    expect(page).toMatchObject({ globalSettings, doesSettingsExist: true, optionWarnings: [] });
  });

  test('surfaces a warning when the read fails for a reason other than a missing blob', async () => {
    vi.mocked(settingsApi.getSystemProperties).mockResolvedValue({
      success: false,
      status: 500,
      errorHeader: 'Internal Server Error',
    });

    const page = await renderPage();

    expect(page).toMatchObject({
      globalSettings: null,
      doesSettingsExist: false,
      optionWarnings: [EntitiesI18nKey.SystemPropertiesReadFailed],
    });
  });

  test('reports no settings blob without a warning when the read throws', async () => {
    vi.mocked(settingsApi.getSystemProperties).mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page).toMatchObject({ globalSettings: null, doesSettingsExist: false, optionWarnings: [] });
  });
});
