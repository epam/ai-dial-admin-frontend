import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import CatalogSchemasList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('CatalogSchemasList', () => {
  test('Should render BaseAssetList scoped to the PlatformCatalogSchemas view', () => {
    render(<CatalogSchemasList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformCatalogSchemas}`)).toBeInTheDocument();
  });
});
