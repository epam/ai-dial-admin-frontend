import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import KeysList from '../List';

vi.mock('@/src/components/Assets/TabbedAssetList/TabbedAssetList', () => ({
  default: ({ view }: { view: string }) => <div data-view={view}>TabbedAssetList</div>,
}));

describe('KeysList', () => {
  test('Renders TabbedAssetList with the PlatformKeys route', () => {
    const { getByText } = render(<KeysList />);

    expect(getByText('TabbedAssetList')).toBeInTheDocument();
  });

  test('Passes the /platform-keys view to TabbedAssetList', () => {
    const { container } = render(<KeysList />);

    expect(container.querySelector('[data-view="/platform-keys"]')).toBeTruthy();
  });
});
