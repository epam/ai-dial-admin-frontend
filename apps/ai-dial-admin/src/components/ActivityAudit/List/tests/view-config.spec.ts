import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getActivities,
  getAnalyticsActivities,
  getDeploymentActivities,
} from '@/src/app/[lang]/activity-audit/actions';
import {
  getActivityAuditColumns,
  getAnalyticsActivityAuditColumns,
  getAuditActivityHref,
  getDeploymentActivityAuditColumns,
} from '@/src/components/ActivityAudit/List/utils';
import { ACTIVITY_AUDIT_VIEW_CONFIG } from '@/src/components/ActivityAudit/List/view-config';
import { ActivityAuditResourceType, ActivityAuditView } from '@/src/types/activity-audit';

vi.mock('@/src/app/[lang]/activity-audit/actions', () => ({
  getActivities: vi.fn(),
  getDeploymentActivities: vi.fn(),
  getAnalyticsActivities: vi.fn(),
}));

vi.mock('@/src/components/ActivityAudit/List/utils', () => ({
  getActivityAuditColumns: vi.fn(() => [{ colId: 'config-columns' }]),
  getDeploymentActivityAuditColumns: vi.fn(() => [{ colId: 'deployment-columns' }]),
  getAnalyticsActivityAuditColumns: vi.fn(() => [{ colId: 'analytics-columns' }]),
  getAuditActivityHref: vi.fn(() => '/models/entity/abc-123'),
}));

const t = (key: string) => key;
const open = vi.fn();
const onRollback = vi.fn();

describe('ACTIVITY_AUDIT_VIEW_CONFIG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('declares an entry for every ActivityAuditView member', () => {
    const views = Object.values(ActivityAuditView);

    views.forEach((view) => {
      expect(ACTIVITY_AUDIT_VIEW_CONFIG[view]).toBeTruthy();
    });
    expect(Object.keys(ACTIVITY_AUDIT_VIEW_CONFIG)).toHaveLength(views.length);
  });

  test('declares every field of the config for every view', () => {
    Object.values(ActivityAuditView).forEach((view) => {
      const config = ACTIVITY_AUDIT_VIEW_CONFIG[view];

      expect(typeof config.fetchActivities).toBe('function');
      expect(typeof config.getColumns).toBe('function');
      expect(typeof config.isRowNavigable).toBe('function');
      expect(typeof config.getEntityActivityHref).toBe('function');
      expect(typeof config.hasParentChildAggregation).toBe('boolean');
      expect(typeof config.hasRollback).toBe('boolean');
      expect(typeof config.hasDeletedParentSuppression).toBe('boolean');
    });
  });

  describe('fetchActivities', () => {
    test('keeps the fetchers the Config and Deployments views use today', () => {
      expect(ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Config].fetchActivities).toBe(getActivities);
      expect(ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Deployments].fetchActivities).toBe(getDeploymentActivities);
    });

    test('names the analytics server action for the Analytics view', () => {
      expect(ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Analytics].fetchActivities).toBe(getAnalyticsActivities);
    });
  });

  describe('getColumns', () => {
    test('Config delegates to the config column factory, passing the single-entity flag through', () => {
      const columns = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Config].getColumns({
        t,
        open,
        onRollback,
        isSingleEntity: true,
      });

      expect(getActivityAuditColumns).toHaveBeenCalledWith(t, open, onRollback, void 0, true);
      expect(columns).toEqual([{ colId: 'config-columns' }]);
    });

    test('Deployments delegates to the deployment column factory on the global page', () => {
      const columns = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Deployments].getColumns({ t, open, onRollback });

      expect(getDeploymentActivityAuditColumns).toHaveBeenCalledWith(t, open, onRollback);
      expect(getActivityAuditColumns).not.toHaveBeenCalled();
      expect(columns).toEqual([{ colId: 'deployment-columns' }]);
    });

    test('Deployments keeps the single-entity column set and its rollback action in an entity tab', () => {
      const columns = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Deployments].getColumns({
        t,
        open,
        onRollback,
        isSingleEntity: true,
      });

      expect(getActivityAuditColumns).toHaveBeenCalledWith(t, open, onRollback, void 0, true);
      expect(getDeploymentActivityAuditColumns).not.toHaveBeenCalled();
      expect(columns).toEqual([{ colId: 'config-columns' }]);
    });

    test('Analytics delegates to the analytics column factory and passes it no rollback handler', () => {
      const columns = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Analytics].getColumns({
        t,
        open,
        onRollback,
        isSingleEntity: true,
      });

      expect(getAnalyticsActivityAuditColumns).toHaveBeenCalledWith(t, open, true);
      expect(getActivityAuditColumns).not.toHaveBeenCalled();
      expect(getDeploymentActivityAuditColumns).not.toHaveBeenCalled();
      expect(columns).toEqual([{ colId: 'analytics-columns' }]);
    });

    test('Analytics passes the single-entity flag on as it is given, without a rollback handler', () => {
      ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Analytics].getColumns({
        t,
        open,
        onRollback,
        isSingleEntity: false,
      });

      expect(getAnalyticsActivityAuditColumns).toHaveBeenCalledWith(t, open, false);
    });
  });

  describe('hasParentChildAggregation and hasRollback', () => {
    test('keeps the Config view aggregating children and offering rollback', () => {
      const config = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Config];

      expect(config.hasParentChildAggregation).toBe(true);
      expect(config.hasRollback).toBe(true);
      expect(config.hasDeletedParentSuppression).toBe(false);
    });

    test('keeps the Deployments view flat and still offering rollback', () => {
      const config = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Deployments];

      expect(config.hasParentChildAggregation).toBe(false);
      expect(config.hasRollback).toBe(true);
      expect(config.hasDeletedParentSuppression).toBe(false);
    });

    test('renders the Analytics view flat and offers no rollback', () => {
      const config = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Analytics];

      expect(config.hasParentChildAggregation).toBe(false);
      expect(config.hasRollback).toBe(false);
      expect(config.hasDeletedParentSuppression).toBe(true);
    });
  });

  describe('isRowNavigable', () => {
    test('treats every Config row as navigable', () => {
      const { isRowNavigable } = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Config];

      expect(isRowNavigable(ActivityAuditResourceType.MODEL)).toBe(true);
      expect(isRowNavigable(ActivityAuditResourceType.ADMIN_PROPERTIES)).toBe(true);
      expect(isRowNavigable(void 0)).toBe(true);
    });

    test('restricts Deployments rows to deployment-manager resources', () => {
      const { isRowNavigable } = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Deployments];

      expect(isRowNavigable(ActivityAuditResourceType.MCP_DEPLOYMENT)).toBe(true);
      expect(isRowNavigable(ActivityAuditResourceType.MODEL)).toBe(false);
      expect(isRowNavigable(void 0)).toBe(false);
    });

    test('treats every Analytics row as navigable', () => {
      const { isRowNavigable } = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Analytics];

      expect(isRowNavigable(ActivityAuditResourceType.TABLE)).toBe(true);
      expect(isRowNavigable(ActivityAuditResourceType.TABLE_COLUMN)).toBe(true);
      expect(isRowNavigable(ActivityAuditResourceType.PIPELINE)).toBe(true);
      expect(isRowNavigable(ActivityAuditResourceType.SAVED_QUERY)).toBe(true);
    });
  });

  describe('getEntityActivityHref', () => {
    const entity = { name: 'entity' };

    test('Config and Deployments keep resolving the entity-namespaced href', () => {
      const params = { entity, entityType: ActivityAuditResourceType.MODEL, activityId: 'abc-123' };

      expect(ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Config].getEntityActivityHref(params)).toBe(
        '/models/entity/abc-123',
      );
      expect(ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Deployments].getEntityActivityHref(params)).toBe(
        '/models/entity/abc-123',
      );
      expect(getAuditActivityHref).toHaveBeenCalledWith(entity, ActivityAuditResourceType.MODEL, 'abc-123');
    });

    test('Analytics resolves the global audit detail page instead of an entity-namespaced route', () => {
      const href = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Analytics].getEntityActivityHref({
        entity,
        entityType: ActivityAuditResourceType.TABLE,
        activityId: 'abc-123',
      });

      expect(href).toBe('/activity-audit/abc-123');
      expect(getAuditActivityHref).not.toHaveBeenCalled();
    });

    test('Analytics encodes the activity identifier and answers empty without one', () => {
      const { getEntityActivityHref } = ACTIVITY_AUDIT_VIEW_CONFIG[ActivityAuditView.Analytics];

      expect(getEntityActivityHref({ entity, activityId: 'abc/123' })).toBe('/activity-audit/abc%2F123');
      expect(getEntityActivityHref({ entity })).toBe('');
    });
  });
});
