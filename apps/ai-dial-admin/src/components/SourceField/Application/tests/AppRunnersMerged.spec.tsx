import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import AppRunners from '@/src/components/SourceField/Application/AppRunners';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { ResourceInfo } from '@/src/server/core/asset-metadata';

vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  getResolvedApplicationScheme: vi.fn().mockResolvedValue({ success: true, response: { schema: {} } }),
}));

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getResolvedRunnerSchema: vi.fn().mockResolvedValue({ success: true, response: { properties: {} } }),
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

vi.mock('@/src/hooks/use-is-mobile-screen', () => ({ useIsMobileScreen: () => false }));
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));

import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';

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

const options = buildAppRunnerOptions([entityRunner], [assetRunner]);

const selectRunner = async (value: string) => {
  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole('combobox'), value);
};

describe('AppRunners :: merged picker', () => {
  test('offers both populations, labelling every row by its $id', () => {
    render(
      <AppRunners
        selectedValue=""
        onChangeValue={vi.fn()}
        runners={options}
        view={ApplicationRoute.AssetsApplications}
      />,
    );

    // Matches the grid's `ID` column, for both populations — the display name is not surfaced here.
    expect(screen.getByRole('option', { name: 'urn:runner:entity' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'http://asdqwe' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'Entity Runner' })).toBeNull();
  });

  test('keeps display names on every other surface, so Entities > Applications is unaffected', () => {
    render(
      <AppRunners selectedValue="" onChangeValue={vi.fn()} runners={options} view={ApplicationRoute.Applications} />,
    );

    expect(screen.getByRole('option', { name: 'Entity Runner' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'urn:runner:entity' })).toBeNull();
  });

  test('selecting an asset runner stores its $id', async () => {
    const onChangeValue = vi.fn();
    render(
      <AppRunners
        selectedValue=""
        onChangeValue={onChangeValue}
        runners={options}
        view={ApplicationRoute.AssetsApplications}
      />,
    );

    await selectRunner(ASSET_ID);

    await waitFor(() => expect(onChangeValue).toHaveBeenCalled());
    expect(onChangeValue).toHaveBeenCalledWith('http://asdqwe', { propA: 'default-a' });
  });

  test('selecting an entity runner still stores its bare $id', async () => {
    const onChangeValue = vi.fn();
    render(
      <AppRunners
        selectedValue=""
        onChangeValue={onChangeValue}
        runners={options}
        view={ApplicationRoute.AssetsApplications}
      />,
    );

    await selectRunner('urn:runner:entity');

    await waitFor(() => expect(onChangeValue).toHaveBeenCalled());
    expect(onChangeValue).toHaveBeenCalledWith('urn:runner:entity', { propA: 'default-a' });
  });

  test('an asset selection resolves against Core using the asset $id', async () => {
    vi.mocked(getResolvedRunnerSchema).mockClear();
    vi.mocked(getResolvedApplicationScheme).mockClear();

    render(
      <AppRunners
        selectedValue=""
        onChangeValue={vi.fn()}
        runners={options}
        view={ApplicationRoute.AssetsApplications}
      />,
    );
    await selectRunner(ASSET_ID);

    await waitFor(() => expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://asdqwe'));
    expect(getResolvedApplicationScheme).not.toHaveBeenCalled();
  });

  test('an entity selection resolves against the admin BE', async () => {
    vi.mocked(getResolvedRunnerSchema).mockClear();
    vi.mocked(getResolvedApplicationScheme).mockClear();

    render(
      <AppRunners
        selectedValue=""
        onChangeValue={vi.fn()}
        runners={options}
        view={ApplicationRoute.AssetsApplications}
      />,
    );
    await selectRunner('urn:runner:entity');

    await waitFor(() => expect(getResolvedApplicationScheme).toHaveBeenCalledWith('urn:runner:entity'));
    expect(getResolvedRunnerSchema).not.toHaveBeenCalled();
  });

  test('a stored $id reopens as the selected option, not blank', () => {
    render(
      <AppRunners
        selectedValue={ASSET_ID}
        onChangeValue={vi.fn()}
        runners={options}
        view={ApplicationRoute.AssetsApplications}
      />,
    );

    expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe(ASSET_ID);
    expect(screen.getByRole<HTMLOptionElement>('option', { name: ASSET_ID }).selected).toBe(true);
  });
});
