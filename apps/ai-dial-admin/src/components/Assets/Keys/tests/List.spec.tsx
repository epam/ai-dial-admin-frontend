import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import KeysList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: { view: string }) => <div data-view={view}>BaseAssetList</div>,
}));

describe('KeysList', () => {
  test('Renders BaseAssetList with the AssetsKeys route', () => {
    const { getByText } = render(<KeysList />);

    expect(getByText('BaseAssetList')).toBeInTheDocument();
  });

  test('Passes the /assets-keys view to BaseAssetList', () => {
    const { container } = render(<KeysList />);

    expect(container.querySelector('[data-view="/assets-keys"]')).toBeTruthy();
  });
});
