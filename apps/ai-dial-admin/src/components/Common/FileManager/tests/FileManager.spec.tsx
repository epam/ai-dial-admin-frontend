import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColDef } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { GRID_COLUMNS_KEY } from '@/src/components/Grid/constants';
import FileManager from '../FileManager';
import { SHOW_HIDDEN_FILES_STORAGE_KEY_PREFIX } from '../constants';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { ApplicationRoute } from '@/src/types/routes';

const { dialFileManagerPropsSpy } = vi.hoisted(() => ({ dialFileManagerPropsSpy: vi.fn() }));

vi.mock('@epam/ai-dial-react-file-manager', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-react-file-manager')>();
  return {
    ...actual,
    DialFileManager: (props: unknown) => {
      dialFileManagerPropsSpy(props);
      return <div>file-manager-stub</div>;
    },
  };
});

const { mockFeatureFlags } = vi.hoisted(() => ({
  mockFeatureFlags: {
    catalogEnabled: true,
  },
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: mockFeatureFlags, isReadOnlyAdmin: false }),
}));

const renderFileManager = (view: ApplicationRoute = ApplicationRoute.AssetsApplications) => {
  const fetchFiles = vi.fn();
  // A stable context object: `files` is what the root-fetch effect keys on, so a fresh literal
  // per render would re-trigger the effect every render and repeat the fetch.
  const files: never[] = [];
  const context = { files, fetchFiles } as unknown as AssetsFolderContextReader;

  render(<FileManager view={view} label="label" columnDefs={[]} getContext={() => context} />);

  return fetchFiles;
};

describe('FileManager', () => {
  beforeEach(() => {
    dialFileManagerPropsSpy.mockClear();
  });

  test('fetches file, platform, and public roots on mount for a dual-bucket view when Catalog is enabled', () => {
    mockFeatureFlags.catalogEnabled = true;

    const fetchFiles = renderFileManager();

    expect(fetchFiles).toHaveBeenCalledOnce();
    expect(fetchFiles).toHaveBeenCalledWith(['file/', 'platform/', 'public/']);
  });

  test('fetches file and public roots for a dual-bucket view when Catalog is disabled', () => {
    mockFeatureFlags.catalogEnabled = false;

    const fetchFiles = renderFileManager();

    expect(fetchFiles).toHaveBeenCalledOnce();
    expect(fetchFiles).toHaveBeenCalledWith(['file/', 'public/']);
  });

  // Regression (4.4): conversation rows and the flat platform views have no folder concept, so
  // drag-and-drop move must be withheld entirely rather than left to resolve as a silent no-op —
  // `handleMoveToFiles` reports success on an empty promise list (`Promise.all([]).every(...)` is
  // vacuously true).
  test('withholds onMoveToFiles for the Conversations view', () => {
    renderFileManager(ApplicationRoute.Conversations);

    const props = dialFileManagerPropsSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(props.onMoveToFiles).toBeUndefined();
  });

  test('withholds onMoveToFiles for a flat platform view', () => {
    renderFileManager(ApplicationRoute.PlatformModels);

    const props = dialFileManagerPropsSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(props.onMoveToFiles).toBeUndefined();
  });

  test('wires onMoveToFiles for a foldered view', () => {
    renderFileManager(ApplicationRoute.AssetsApplications);

    const props = dialFileManagerPropsSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(props.onMoveToFiles).toBeInstanceOf(Function);
  });
});

describe('FileManager — hidden files toggle', () => {
  const lastProps = () => dialFileManagerPropsSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;

  beforeEach(() => {
    dialFileManagerPropsSpy.mockClear();
    localStorage.clear();
  });

  test('controls hidden files visibility and enables the popup switcher for the Files view', () => {
    renderFileManager(ApplicationRoute.Files);

    expect(lastProps().showHiddenFiles).toBe(false);
    expect(lastProps().onShowHiddenFilesChange).toBeInstanceOf(Function);
    expect(lastProps().showHiddenFileSwitcherInDestinationPopup).toBe(true);
    expect((lastProps().toolbarOptions as { showHiddenFilesToggle: boolean }).showHiddenFilesToggle).toBe(true);
  });

  test('leaves hidden files uncontrolled for other views', () => {
    renderFileManager(ApplicationRoute.Prompts);

    expect(lastProps().showHiddenFiles).toBeUndefined();
    expect(lastProps().onShowHiddenFilesChange).toBeUndefined();
    expect((lastProps().toolbarOptions as { showHiddenFilesToggle: boolean }).showHiddenFilesToggle).toBe(false);
  });

  test('restores the stored visibility for the Files view', () => {
    localStorage.setItem(`${SHOW_HIDDEN_FILES_STORAGE_KEY_PREFIX}:${ApplicationRoute.Files}`, 'true');

    renderFileManager(ApplicationRoute.Files);

    expect(lastProps().showHiddenFiles).toBe(true);
  });
});

describe('FileManager — grid state persistence', () => {
  const STORAGE_KEY = `${GRID_COLUMNS_KEY}${ApplicationRoute.Prompts}`;
  const STORED_MODEL = {
    columns: [
      { colId: 'author', sort: 'asc' },
      { colId: 'name', width: 420 },
    ],
    filters: { name: { filter: 'readme' } },
    sizedColIds: ['name'],
  };

  const lastProps = () => dialFileManagerPropsSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
  const lastGridOptions = () =>
    (lastProps().gridOptions as { additionalGridOptions: Record<string, unknown>; columnDefs: ColDef[] })
      .additionalGridOptions;

  const makeApi = () => ({
    applyColumnState: vi.fn(),
    setFilterModel: vi.fn(),
    getColumnState: vi.fn(() => []),
    getFilterModel: vi.fn(() => ({})),
  });

  const renderPrompts = () => {
    const context = { files: [], fetchFiles: vi.fn() } as unknown as AssetsFolderContextReader;
    render(
      <FileManager
        view={ApplicationRoute.Prompts}
        label="label"
        columnDefs={[{ field: 'name' }, { field: 'author' }]}
        getContext={() => context}
      />,
    );
  };

  const attachGrid = (api: ReturnType<typeof makeApi>) => {
    act(() => {
      (lastProps().onGridApiChange as (api: unknown) => void)(api);
    });
  };

  beforeEach(() => {
    dialFileManagerPropsSpy.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('hands the persistence handlers to the grid', () => {
    renderPrompts();

    expect(lastGridOptions()).toMatchObject({
      onFilterChanged: expect.any(Function),
      onSortChanged: expect.any(Function),
      onColumnMoved: expect.any(Function),
      onColumnResized: expect.any(Function),
      onGridColumnsChanged: expect.any(Function),
    });
  });

  test('restores the stored state of the list once the grid is attached', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORED_MODEL));
    renderPrompts();
    const api = makeApi();

    attachGrid(api);

    expect(api.setFilterModel).toHaveBeenCalledWith(STORED_MODEL.filters);
    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [
        { colId: 'author', sort: 'asc' },
        { colId: 'name', width: 420, flex: null },
      ],
      applyOrder: true,
    });
  });

  test('restores the stored state again when the library rebuilds the columns', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORED_MODEL));
    renderPrompts();
    const api = makeApi();

    act(() => {
      (lastGridOptions().onGridColumnsChanged as (event: unknown) => void)({ api });
    });

    expect(api.applyColumnState).toHaveBeenCalledWith(expect.objectContaining({ applyOrder: true }));
  });

  test('gives a dragged column its stored width as a fixed width', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORED_MODEL));
    renderPrompts();

    const { columnDefs } = lastProps().gridOptions as { columnDefs: ColDef[] };
    expect(columnDefs.find((col) => col.field === 'name')).toMatchObject({ width: 420, flex: null });
  });

  test('stores filters in the list entry and never in session storage', () => {
    renderPrompts();
    const api = { ...makeApi(), getFilterModel: vi.fn(() => ({ name: { filter: 'readme' } })) };
    attachGrid(api);

    act(() => {
      (lastGridOptions().onFilterChanged as (event: unknown) => void)({ api });
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').filters).toEqual({ name: { filter: 'readme' } });
    expect(sessionStorage.length).toBe(0);
  });
});

describe('FileManager — reset filters', () => {
  const lastProps = () => dialFileManagerPropsSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;

  const makeApi = (filters: Record<string, unknown>) => {
    const listeners: Record<string, () => void> = {};
    return {
      getFilterModel: vi.fn(() => filters),
      setFilterModel: vi.fn(),
      applyColumnState: vi.fn(),
      getColumnState: vi.fn(() => []),
      addEventListener: vi.fn((event: string, listener: () => void) => {
        listeners[event] = listener;
      }),
      removeEventListener: vi.fn(),
      listeners,
    };
  };

  const renderWithGrid = (api: ReturnType<typeof makeApi>) => {
    const context = { files: [], fetchFiles: vi.fn() } as unknown as AssetsFolderContextReader;
    render(<FileManager view={ApplicationRoute.Prompts} label="label" columnDefs={[]} getContext={() => context} />);
    act(() => {
      (lastProps().onGridApiChange as (api: unknown) => void)(api);
    });
    render((lastProps().toolbarOptions as { additionalButtons: React.ReactNode }).additionalButtons);
  };

  beforeEach(() => {
    dialFileManagerPropsSpy.mockClear();
    localStorage.clear();
  });

  test('offers no reset button while no filter is applied', () => {
    renderWithGrid(makeApi({}));

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ResetFilters })).toBeNull();
  });

  test('offers the reset button next to the toolbar actions once a filter is applied', () => {
    renderWithGrid(makeApi({ name: { filter: 'readme' } }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ResetFilters })).toBeTruthy();
  });

  test('clears only the filters when the reset button is clicked', async () => {
    const user = userEvent.setup();
    const api = makeApi({ name: { filter: 'readme' } });
    renderWithGrid(api);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.ResetFilters }));

    expect(api.setFilterModel).toHaveBeenCalledWith(null);
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ResetFilters })).toBeNull();
  });
});
