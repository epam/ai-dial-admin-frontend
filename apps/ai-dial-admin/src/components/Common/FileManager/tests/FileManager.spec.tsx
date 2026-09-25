import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import FileManager from '../FileManager';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { ApplicationRoute } from '@/src/types/routes';

const { dialFileManagerPropsSpy } = vi.hoisted(() => ({ dialFileManagerPropsSpy: vi.fn() }));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
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
