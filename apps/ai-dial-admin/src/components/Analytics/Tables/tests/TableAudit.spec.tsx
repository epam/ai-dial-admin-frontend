import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const entityAuditSpy = vi.fn();

vi.mock('@/src/components/EntityTabs/Audit/EntityAudit', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    entityAuditSpy(props);
    return <div />;
  },
}));

import TableAudit from '@/src/components/Analytics/Tables/TableAudit';
import { resolveEntityAuditType } from '@/src/components/ActivityAudit/View/Header/utils';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FeatureFlags } from '@/src/models/feature-flags';
import { ActivityAuditResourceType, ActivityAuditView } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getAuditTabs } from '@/src/utils/tabs/utils';

const table: AnalyticsTable = {
  name: 'orders',
  description: 'Order facts',
  type: AnalyticsTableType.Source,
};

const renderTableAudit = (props?: Partial<AnalyticsTable>) => render(<TableAudit table={{ ...table, ...props }} />);

const lastEntity = (): BaseEntity => entityAuditSpy.mock.lastCall?.[0].entity as BaseEntity;

describe('TableAudit', () => {
  beforeEach(() => {
    entityAuditSpy.mockClear();
  });

  test('renders EntityAudit for the analytics tables route in the Analytics view mode', () => {
    renderTableAudit();

    expect(entityAuditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: { name: 'orders', description: 'Order facts' },
        view: ApplicationRoute.AnalyticsTables,
        viewMode: ActivityAuditView.Analytics,
      }),
    );
  });

  test('projects the table onto an entity carrying its name so the list is narrowed to that table', () => {
    renderTableAudit({ name: 'conversations' });

    expect(lastEntity().name).toBe('conversations');
  });

  test('projects a table with no description onto an entity with an undefined description', () => {
    renderTableAudit({ description: void 0 });

    expect(lastEntity()).toEqual({ name: 'orders', description: void 0 });
  });

  test('keeps the projected entity reference stable across a re-render with the same table', () => {
    const { rerender } = renderTableAudit();
    const firstEntity = lastEntity();

    rerender(<TableAudit table={{ ...table }} />);

    expect(lastEntity()).toBe(firstEntity);
  });

  test('projects an entity whose audit resource type resolves to Table', () => {
    renderTableAudit();

    expect(resolveEntityAuditType(lastEntity(), ApplicationRoute.AnalyticsTables)).toBe(
      ActivityAuditResourceType.TABLE,
    );
  });
});

describe('TableAudit — sub-tab rail', () => {
  const featureFlags = { dashboardEnabled: true, analyticsEnabled: true } as FeatureFlags;

  // The view the component passes decides the rail EntityAudit renders; the telemetry sub-tabs are
  // keyed by a deployment name and have no meaning for a catalog table.
  test('resolves to Activities and nothing else for the analytics tables route', () => {
    const tabs = getAuditTabs((key: string) => key, featureFlags, ApplicationRoute.AnalyticsTables);

    expect(tabs.map((tab) => tab.id)).toEqual([EntityViewTab.Activities]);
  });
});
