import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import EntityAudit from '../EntityAudit';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { featureFlags: { dashboardEnabled: true } };
  }),
}));

describe('EntityAudit', () => {
  test('renders audit', () => {
    const entity = { name: 'Test Entity', id: '123' };

    render(<EntityAudit entity={entity} view={ApplicationRoute.Dashboard} />);

    expect(screen.getByRole('dashboards')).toBeInTheDocument();
  });
});
