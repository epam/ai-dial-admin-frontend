import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import PoliciesList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: { view: string }) => <div>base-asset-list:{view}</div>,
}));

describe('PoliciesList', () => {
  test('renders BaseAssetList scoped to the PlatformPolicies view', () => {
    render(<PoliciesList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformPolicies}`)).toBeTruthy();
  });
});
