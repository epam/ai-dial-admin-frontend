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

import PipelineAudit from '@/src/components/Analytics/Pipelines/PipelineAudit';
import { resolveEntityAuditType } from '@/src/components/ActivityAudit/View/Header/utils';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FeatureFlags } from '@/src/models/feature-flags';
import { Pipeline, PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { ActivityAuditResourceType, ActivityAuditView } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getAuditTabs } from '@/src/utils/tabs/utils';

const pipeline: Pipeline = {
  name: 'daily_rollup',
  kind: PipelineKind.Aggregate,
  target: 'daily_rollup_table',
  trigger: { kind: TriggerKind.Schedule, cron: '0 * * * *' },
  enabled: true,
  generation: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

const renderPipelineAudit = (props?: Partial<Pipeline>) =>
  render(<PipelineAudit pipeline={{ ...pipeline, ...props }} />);

const lastEntity = (): BaseEntity => entityAuditSpy.mock.lastCall?.[0].entity as BaseEntity;

describe('PipelineAudit', () => {
  beforeEach(() => {
    entityAuditSpy.mockClear();
  });

  test('renders EntityAudit for the analytics pipelines route in the Analytics view mode', () => {
    renderPipelineAudit();

    expect(entityAuditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: { name: 'daily_rollup' },
        view: ApplicationRoute.AnalyticsPipelines,
        viewMode: ActivityAuditView.Analytics,
      }),
    );
  });

  test('projects the pipeline onto an entity carrying its name so the list is narrowed to that pipeline', () => {
    renderPipelineAudit({ name: 'hourly_backfill' });

    expect(lastEntity().name).toBe('hourly_backfill');
  });

  test('keeps the projected entity reference stable across a re-render with an equal pipeline', () => {
    const { rerender } = renderPipelineAudit();
    const firstEntity = lastEntity();

    rerender(<PipelineAudit pipeline={{ ...pipeline }} />);

    expect(lastEntity()).toBe(firstEntity);
  });

  test('projects an entity whose audit resource type resolves to Pipeline', () => {
    renderPipelineAudit();

    expect(resolveEntityAuditType(lastEntity(), ApplicationRoute.AnalyticsPipelines)).toBe(
      ActivityAuditResourceType.PIPELINE,
    );
  });
});

describe('PipelineAudit — sub-tab rail', () => {
  const featureFlags = { dashboardEnabled: true, analyticsEnabled: true } as FeatureFlags;

  // The view the component passes decides the rail EntityAudit renders; the telemetry sub-tabs are
  // keyed by a deployment name and have no meaning for a pipeline.
  test('resolves to Activities and nothing else for the analytics pipelines route', () => {
    const tabs = getAuditTabs((key: string) => key, featureFlags, ApplicationRoute.AnalyticsPipelines);

    expect(tabs.map((tab) => tab.id)).toEqual([EntityViewTab.Activities]);
  });
});
