import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import EntityAudit from '../EntityAudit';
import { TabsI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { featureFlags: { dashboardEnabled: true } };
  }),
}));

describe('EntityAudit', () => {
  test('renders audit tab with Activities and Dashboards', () => {
    const entity = { name: 'Test Entity', id: '123' };

    render(<EntityAudit entity={entity} view={ApplicationRoute.Models} />);

    expect(screen.getByRole('tab', { name: TabsI18nKey.Activities })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: TabsI18nKey.Dashboard })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: TabsI18nKey.Traces })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: TabsI18nKey.Conversations })).toBeInTheDocument();
    expect(screen.getByRole('dashboards')).toBeInTheDocument();
  });

  test('renders audit tab with Activities only', () => {
    const entity = { name: 'Test Entity', id: '123' };

    render(<EntityAudit entity={entity} view={ApplicationRoute.Roles} />);

    expect(screen.getByRole('tab', { name: TabsI18nKey.Activities })).toBeInTheDocument();
    expect(screen.getByRole('activities')).toBeInTheDocument();
  });
});
