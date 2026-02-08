import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AppsList from '../List';

// Mock dependencies
vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  bulkDeleteApps: vi.fn(),
  createApp: vi.fn(),
  moveApps: vi.fn(),
  removeApp: vi.fn(),
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: vi.fn(() => ({ data: [{ id: 'a' }] })),
}));

vi.mock('@/src/components/EntityListView/EntityListView', () => ({
  default: vi.fn(({ data, names, route }) => <div role="list">EntityListView</div>),
}));
describe('AppsList', () => {
  const mockRunners: DialApplicationScheme[] = [
    { id: 'runner-1', name: 'Runner 1' } as DialApplicationScheme,
    { id: 'runner-2', name: 'Runner 2' } as DialApplicationScheme,
  ];

  const mockAppData: AssetWithVersion[] = [
    {
      id: 'app-1',
      name: 'App 1',
      version: '1.0.0',
      folderId: 'folder-1',
    } as AssetWithVersion,
    {
      id: 'app-2',
      name: 'App 2',
      version: '2.0.0',
      folderId: 'folder-1',
    } as AssetWithVersion,
    {
      id: 'app-3',
      name: 'App 1',
      version: '1.1.0',
      folderId: 'folder-1',
    } as AssetWithVersion,
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAppsFolder).mockReturnValue({
      data: mockAppData,
    } as any);
  });

  test('should render BaseEntityList component', () => {
    render(<AppsList runners={mockRunners} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
