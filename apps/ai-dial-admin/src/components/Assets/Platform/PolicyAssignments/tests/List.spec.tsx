import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import PolicyAssignmentsList from '../List';

vi.mock('@/src/components/Assets/TabbedAssetList/TabbedAssetList', () => ({
  default: ({ view }: { view: string }) => <div>base-asset-list:{view}</div>,
}));

describe('PolicyAssignmentsList', () => {
  test('renders TabbedAssetList scoped to the PlatformPolicyAssignments view', () => {
    render(<PolicyAssignmentsList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformPolicyAssignments}`)).toBeTruthy();
  });
});
