import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import AliasesList from '../List';

vi.mock('@/src/components/Assets/TabbedAssetList/TabbedAssetList', () => ({
  default: ({ view }: { view: string }) => <div>tabbed-asset-list:{view}</div>,
}));

describe('AliasesList', () => {
  test('is the shared tabbed listing over the aliases view, with no list logic of its own', () => {
    render(<AliasesList />);

    expect(screen.getByText(`tabbed-asset-list:${ApplicationRoute.AssetsAliases}`)).toBeTruthy();
  });
});
