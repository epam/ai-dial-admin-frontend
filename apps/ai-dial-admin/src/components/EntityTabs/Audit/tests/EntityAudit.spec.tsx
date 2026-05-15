import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ActivityAuditResourceType, ActivityAuditView } from '@/src/types/activity-audit';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import EntityAudit from '../EntityAudit';
import { TabsI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { featureFlags: { dashboardEnabled: true } };
  }),
}));

const listPropsSpy = vi.fn();
vi.mock('@/src/components/ActivityAudit/List/List', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    listPropsSpy(props);
    return <div role="activities" />;
  },
}));

describe('EntityAudit', () => {
  beforeEach(() => {
    listPropsSpy.mockClear();
  });

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

  test('forwards container audit type via resolveEntityAuditType for a NIM Model Serving', () => {
    const container = { name: 'gpt-4-turbo', $type: CONTAINER_TYPE.NIM };

    render(
      <EntityAudit entity={container} view={ApplicationRoute.ModelServings} viewMode={ActivityAuditView.Deployments} />,
    );

    expect(listPropsSpy).toHaveBeenCalled();
    const props = listPropsSpy.mock.calls[listPropsSpy.mock.calls.length - 1][0];
    expect(props.entityType).toBe(ActivityAuditResourceType.NIM_DEPLOYMENT);
    expect(props.viewMode).toBe(ActivityAuditView.Deployments);
    expect(props.entity).toBe(container);
  });

  test('forwards admin audit type via routeAuditResource fallback for a Model', () => {
    const model = { name: 'gpt-4-turbo' };

    render(<EntityAudit entity={model} view={ApplicationRoute.Models} />);
    fireEvent.click(screen.getByRole('tab', { name: TabsI18nKey.Activities }));

    expect(listPropsSpy).toHaveBeenCalled();
    const props = listPropsSpy.mock.calls[listPropsSpy.mock.calls.length - 1][0];
    expect(props.entityType).toBe(ActivityAuditResourceType.MODEL);
    expect(props.viewMode).toBeUndefined();
  });
});
