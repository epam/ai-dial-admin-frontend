import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, Mock, test, vi } from 'vitest';
import PlatformToolsetView from '../View';

vi.mock('@/src/context/assets/ToolsetsFolderContext', () => ({
  useToolsetFolder: vi.fn(),
}));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-toolsets/actions')>()),
  removePlatformToolset: vi.fn(),
  updatePlatformToolset: vi.fn(),
  signInToolset: vi.fn(),
  signOutToolset: vi.fn(),
}));

/**
 * Matches `Assets/Platform/Applications/tests/View.spec.tsx`'s scope: a render smoke test, not deep
 * interaction coverage — the component's real dependency surface (`TabsContent`, `SimpleEntityHeader`,
 * `ResourceAuthButtons`) is exercised at the shared-component level, since this view reuses them
 * unmodified (design.md's Context — Core gives platform-bucket toolsets full field/tab/auth parity).
 */
describe('PlatformToolsetView', () => {
  const mockFetchFiles = vi.fn();

  const mockOriginalToolset: AssetToolset = {
    name: 'platform-toolset',
    version: '',
    folderId: 'platform/',
    path: 'platform/platform-toolset',
    displayName: 'Platform Toolset',
  } as AssetToolset;

  const mockEtag = 'etag-123';

  beforeEach(() => {
    vi.clearAllMocks();

    (useToolsetFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
    });
  });

  test('renders the platform toolset detail view without crashing', () => {
    render(<PlatformToolsetView etag={mockEtag} originalToolset={mockOriginalToolset} />);

    expect(screen.getByText('platform-toolset')).toBeTruthy();
  });
});
