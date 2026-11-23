import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import ModelsList from '../List';

vi.mock('@/src/components/Assets/TabbedAssetList/TabbedAssetList', () => ({
  default: ({ view, runners }: any) => (
    <div>
      base-asset-list:{view}
      {runners !== undefined && `:runners=${JSON.stringify(runners)}`}
    </div>
  ),
}));

describe('ModelsList', () => {
  test('renders TabbedAssetList scoped to the Models view, without a runners prop', () => {
    render(<ModelsList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformModels}`)).toBeInTheDocument();
    expect(screen.queryByText(/runners=/)).not.toBeInTheDocument();
  });
});
