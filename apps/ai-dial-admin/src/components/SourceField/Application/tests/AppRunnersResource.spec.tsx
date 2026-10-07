import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import AppRunnersResource from '@/src/components/SourceField/Application/AppRunnersResource';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ResourceInfo } from '@/src/server/core/asset-metadata';

vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  getResolvedApplicationScheme: vi.fn().mockResolvedValue({ success: true, response: { schema: {} } }),
}));

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getResolvedRunnerSchema: vi.fn().mockResolvedValue({ success: true, response: { properties: {} } }),
  getRunner: vi
    .fn()
    .mockResolvedValue({ success: true, response: { $id: 'http://asdqwe', path: 'http%3A%2F%2Fasdqwe' } }),
}));

vi.mock('@/src/utils/schema', () => ({
  getSchemaDefaults: vi.fn(() => ({ propA: 'default-a' })),
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialSelectField: ({ id, options, onChange, value, label }: any) => (
      <select aria-label={label || id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">--</option>
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

// The grid is not under test; the immutable branch only needs its trigger.
vi.mock('@/src/components/SourceField/Application/SelectAppRunnersModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('@/src/hooks/use-is-mobile-screen', () => ({ useIsMobileScreen: () => false }));
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));

import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { getResolvedRunnerSchema, getRunner } from '@/src/app/[lang]/platform-app-runners/actions';

const ASSET_ID = 'http://asdqwe';

const entityRunner = {
  $id: 'urn:runner:entity',
  'dial:applicationTypeDisplayName': 'Entity Runner',
} as unknown as DialApplicationScheme;

const assetRunner = {
  name: 'http://asdqwe',
  path: 'http%3A%2F%2Fasdqwe',
  folderId: '',
} as ResourceInfo;

// The component writes a resolved `$id` back onto the runner it was handed, so options are rebuilt per test.
let options: ReturnType<typeof buildAppRunnerOptions>;

const selectRunner = async (value: string) => {
  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole('combobox'), value);
};

describe('AppRunnersResource', () => {
  beforeEach(() => {
    options = buildAppRunnerOptions([{ ...entityRunner }], [{ ...assetRunner }]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('offers both populations, labelling every row by its $id', () => {
    render(<AppRunnersResource selectedValue="" onChangeValue={vi.fn()} runners={options} />);

    // Matches the grid's `ID` column, for both populations — the display name is not surfaced here.
    expect(screen.getByRole('option', { name: 'urn:runner:entity' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'http://asdqwe' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'Entity Runner' })).toBeNull();
  });

  test('selecting a platform runner fetches its content and stores the content $id', async () => {
    const onChangeValue = vi.fn();
    render(<AppRunnersResource selectedValue="" onChangeValue={onChangeValue} runners={options} />);

    await selectRunner(ASSET_ID);

    await waitFor(() => expect(getRunner).toHaveBeenCalledWith('http%3A%2F%2Fasdqwe', '*'));
    expect(onChangeValue).toHaveBeenCalledWith('http://asdqwe', { propA: 'default-a' });
  });

  test('a platform runner whose content $id was edited resolves and stores the corrected id, not the picker option $id', async () => {
    vi.mocked(getRunner).mockResolvedValueOnce({
      success: true,
      // A merged runner read carries its identity under `_metadata` (the merge layer's graft), never
      // flat — the component only consumes `$id` from this response.
      response: {
        $id: 'http://asdqwe/edited',
        _metadata: { name: 'edited', path: 'http%3A%2F%2Fasdqwe', folderId: 'public' },
      },
    });
    const onChangeValue = vi.fn();
    render(<AppRunnersResource selectedValue="" onChangeValue={onChangeValue} runners={options} />);

    await selectRunner(ASSET_ID);

    await waitFor(() => expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://asdqwe/edited'));
    expect(onChangeValue).toHaveBeenCalledWith('http://asdqwe/edited', { propA: 'default-a' });
  });

  test('selecting an entity runner still stores its bare $id', async () => {
    const onChangeValue = vi.fn();
    render(<AppRunnersResource selectedValue="" onChangeValue={onChangeValue} runners={options} />);

    await selectRunner('urn:runner:entity');

    await waitFor(() => expect(onChangeValue).toHaveBeenCalled());
    expect(onChangeValue).toHaveBeenCalledWith('urn:runner:entity', { propA: 'default-a' });
  });

  test('a platform selection resolves against Core using the content $id', async () => {
    vi.mocked(getResolvedRunnerSchema).mockClear();
    vi.mocked(getResolvedApplicationScheme).mockClear();

    render(<AppRunnersResource selectedValue="" onChangeValue={vi.fn()} runners={options} />);
    await selectRunner(ASSET_ID);

    await waitFor(() => expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://asdqwe'));
    expect(getResolvedApplicationScheme).not.toHaveBeenCalled();
  });

  test('an entity selection resolves against the admin BE', async () => {
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin-be');
    vi.mocked(getResolvedRunnerSchema).mockClear();
    vi.mocked(getResolvedApplicationScheme).mockClear();

    render(<AppRunnersResource selectedValue="" onChangeValue={vi.fn()} runners={options} />);
    await selectRunner('urn:runner:entity');

    await waitFor(() => expect(getResolvedApplicationScheme).toHaveBeenCalledWith('urn:runner:entity'));
  });

  test('a stored $id reopens as the selected option, not blank', () => {
    render(<AppRunnersResource selectedValue={ASSET_ID} onChangeValue={vi.fn()} runners={options} />);

    expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe(ASSET_ID);
    expect(screen.getByRole<HTMLOptionElement>('option', { name: ASSET_ID }).selected).toBe(true);
  });

  test('calls onChangeValue with defaults from the resolved schema', async () => {
    const onChangeValue = vi.fn();
    render(<AppRunnersResource selectedValue="" onChangeValue={onChangeValue} runners={options} />);

    await selectRunner('urn:runner:entity');

    await waitFor(() => expect(onChangeValue).toHaveBeenCalledWith('urn:runner:entity', { propA: 'default-a' }));
  });

  test('a stored id missing from the list is still shown, without an Open control', () => {
    render(
      <AppRunnersResource
        selectedValue="http://asdqwe/edited"
        onChangeValue={vi.fn()}
        runners={options}
        isEntityImmutable
      />,
    );

    expect(screen.getByText('http://asdqwe/edited')).toBeDefined();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Open })).toBeNull();
  });

  describe('open in a new tab', () => {
    const openUrl = async (selectedValue: string) => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(
        <AppRunnersResource
          selectedValue={selectedValue}
          onChangeValue={vi.fn()}
          runners={options}
          isEntityImmutable
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));
      const url = open.mock.calls[0][0] as string;
      open.mockRestore();
      return url;
    };

    test('a Platform runner opens by storage path', async () => {
      expect(await openUrl(ASSET_ID)).toMatch(/\/platform-app-runners\/http%253A%252F%252Fasdqwe$/);
    });

    test('a configuration-file runner opens in config-file mode', async () => {
      expect(await openUrl('urn:runner:entity')).toMatch(
        /\/platform-app-runners\/urn%3Arunner%3Aentity\?configFile=true$/,
      );
    });
  });
});
