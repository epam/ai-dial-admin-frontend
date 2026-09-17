import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import FileManager from '../FileManager';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialFileManager: () => <div>file-manager-stub</div>,
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

const renderFileManager = () => {
  const fetchFiles = vi.fn();
  // A stable context object: `files` is what the root-fetch effect keys on, so a fresh literal
  // per render would re-trigger the effect every render and repeat the fetch.
  const files: never[] = [];
  const context = { files, fetchFiles } as unknown as AssetsFolderContext;

  render(
    <FileManager view={ApplicationRoute.AssetsApplications} label="label" columnDefs={[]} getContext={() => context} />,
  );

  return fetchFiles;
};

describe('FileManager', () => {
  test('fetches both bucket roots on mount for a dual-bucket view when Catalog is enabled', () => {
    mockFeatureFlags.catalogEnabled = true;

    const fetchFiles = renderFileManager();

    expect(fetchFiles).toHaveBeenCalledOnce();
    expect(fetchFiles).toHaveBeenCalledWith(['platform/', 'public/']);
  });

  test('fetches only the public root for a dual-bucket view when Catalog is disabled', () => {
    mockFeatureFlags.catalogEnabled = false;

    const fetchFiles = renderFileManager();

    expect(fetchFiles).toHaveBeenCalledOnce();
    expect(fetchFiles).toHaveBeenCalledWith('public/');
  });
});
