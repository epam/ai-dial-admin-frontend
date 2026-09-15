import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileCatalogSchemas } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import PlatformCatalogSchemasPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', () => ({ getConfigFileCatalogSchemas: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-catalog-schemas:{names.length}:{route}
    </div>
  ),
}));
vi.mock('../List', () => ({ default: () => <div>asset-catalog-schemas-list</div> }));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('PlatformCatalogSchemasPageList', () => {
  test('renders the asset list and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<PlatformCatalogSchemasPageList />);

    expect(screen.getByText('asset-catalog-schemas-list')).toBeTruthy();
    expect(getConfigFileCatalogSchemas).not.toHaveBeenCalled();
  });

  test('renders the shared config-file list, for the catalog-schemas route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileCatalogSchemas).mockResolvedValue({
      success: true,
      data: ['agent-card'],
    });

    render(<PlatformCatalogSchemasPageList />);

    expect(await screen.findByText('config-file-catalog-schemas:1:/platform-catalog-schemas')).toBeTruthy();
  });
});
