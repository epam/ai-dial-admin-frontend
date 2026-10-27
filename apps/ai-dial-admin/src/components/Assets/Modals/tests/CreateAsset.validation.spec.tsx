import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { ToolsetTransport } from '@/src/types/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import CreateAsset from '../CreateAsset';

// The real validation context and the real properties form: the bug this guards against is an
// ordering one between the ID control's mount validation and CreateAsset's own effects, which a
// mocked `dispatch` cannot see.
vi.mock('@/src/context/SaveValidationContext', async () => vi.importActual('@/src/context/SaveValidationContext'));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  bulkDeleteApps: vi.fn(),
  bulkDeletePlatformApplications: vi.fn(),
  createApp: vi.fn(),
  createPlatformApplication: vi.fn(),
  exportApps: vi.fn(),
  getApp: vi.fn(),
  getPlatformApplication: vi.fn(),
  importApps: vi.fn(),
  moveApps: vi.fn(),
}));
vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  bulkDeletePlatformToolsets: vi.fn(),
  bulkDeleteToolsets: vi.fn(),
  createPlatformToolset: vi.fn(),
  createToolset: vi.fn(),
  exportToolsets: vi.fn(),
  getPlatformToolset: vi.fn(),
  getToolset: vi.fn(),
  importToolsets: vi.fn(),
  moveToolsets: vi.fn(),
}));
vi.mock('@/src/components/Common/FolderList/FolderList', () => ({ default: () => null }));

const { SaveValidationContextProvider }: typeof import('@/src/context/SaveValidationContext') = await vi.importActual(
  '@/src/context/SaveValidationContext',
);

// Every root already fetched; `taken` exists only in Core's configuration file.
const contextOn = (filePath: string) =>
  ({
    files: [],
    expandedFolders: new Set<string>(),
    setExpandedFolders: vi.fn(),
    filePath,
    setFilePath: vi.fn(),
    fetchedFoldersData: {
      'platform/': [],
      'public/': [],
      'public/other/': [{ name: 'taken', path: 'public/other/taken__1.0.0', version: '1.0.0' }],
      'file/': [{ name: 'taken', path: 'file/taken' }],
    },
    fetchFiles: vi.fn(),
    isFetchingFiles: false,
    hasFetchError: false,
  }) as unknown as AssetsFolderContextReader;

const Modal = ({ filePath }: { filePath: string }): ReactNode => (
  <CreateAsset
    view={ApplicationRoute.AssetsToolsets}
    isModalOpen={true}
    context={() => contextOn(filePath)}
    initialValues={{
      name: 'taken',
      displayName: 'Taken',
      endpoint: 'http://box/mcp',
      transport: ToolsetTransport.HTTP,
    }}
    shouldOpenOnPlatform
    onClose={vi.fn()}
  />
);

const createButton = () => screen.getByRole('button', { name: 'Buttons.Create' });

describe('CreateAsset — name validity across buckets', () => {
  test('keeps Create disabled for a configuration-file name after switching to platform', () => {
    const { rerender } = render(
      <SaveValidationContextProvider>
        <Modal filePath="public/" />
      </SaveValidationContextProvider>,
    );
    expect(createButton()).toBeEnabled();

    rerender(
      <SaveValidationContextProvider>
        <Modal filePath="platform/" />
      </SaveValidationContextProvider>,
    );

    expect(createButton()).toBeDisabled();
  });

  test('enables Create again once the same name is moved back to public', () => {
    const { rerender } = render(
      <SaveValidationContextProvider>
        <Modal filePath="platform/" />
      </SaveValidationContextProvider>,
    );
    expect(createButton()).toBeDisabled();

    rerender(
      <SaveValidationContextProvider>
        <Modal filePath="public/" />
      </SaveValidationContextProvider>,
    );

    expect(createButton()).toBeEnabled();
  });

  test('re-checks the name when moving to another public folder that already holds it', () => {
    const { rerender } = render(
      <SaveValidationContextProvider>
        <Modal filePath="public/" />
      </SaveValidationContextProvider>,
    );
    expect(createButton()).toBeEnabled();

    rerender(
      <SaveValidationContextProvider>
        <Modal filePath="public/other/" />
      </SaveValidationContextProvider>,
    );

    expect(createButton()).toBeDisabled();
  });
});
