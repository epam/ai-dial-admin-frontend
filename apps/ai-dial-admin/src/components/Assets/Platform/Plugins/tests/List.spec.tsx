import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import PluginsList from '../List';

vi.mock('@/src/components/Assets/TabbedAssetList/TabbedAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('PluginsList', () => {
  test('renders TabbedAssetList scoped to the PlatformPlugins view', () => {
    render(<PluginsList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformPlugins}`)).toBeInTheDocument();
  });
});
