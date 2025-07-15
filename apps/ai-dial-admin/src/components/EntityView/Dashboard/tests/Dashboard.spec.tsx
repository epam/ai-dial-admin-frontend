import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import EntityDashboard from '../Dashboard';

describe('EntityDashboard', () => {
  test('renders dashboard', () => {
    const entity = { name: 'Test Entity', id: '123' };

    render(<EntityDashboard entity={entity} view={ApplicationRoute.Dashboard} />);

    expect(screen.getByRole('dashboards')).toBeInTheDocument();
  });
});
