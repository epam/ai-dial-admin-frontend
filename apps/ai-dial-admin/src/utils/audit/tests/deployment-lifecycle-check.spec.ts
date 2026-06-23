import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';

import { needsDeploymentLifecycleCheck } from '../deployment-lifecycle-check';

const activity = (overrides: Partial<DialActivity>): DialActivity =>
  ({
    activityType: ActivityAuditType.Update,
    resourceType: ActivityAuditResourceType.MCP_DEPLOYMENT,
    resourceId: 'dep-1',
    revision: 42,
    activityId: 'a1',
    ...overrides,
  }) as DialActivity;

describe('needsDeploymentLifecycleCheck', () => {
  test('Update on a container deployment needs the lifecycle check', () => {
    expect(needsDeploymentLifecycleCheck(activity({ activityType: ActivityAuditType.Update }))).toBe(true);
  });

  test('Update on an image definition needs the lifecycle check', () => {
    expect(
      needsDeploymentLifecycleCheck(
        activity({
          activityType: ActivityAuditType.Update,
          resourceType: ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
        }),
      ),
    ).toBe(true);
  });

  test('Delete is not gated by the lifecycle check', () => {
    expect(needsDeploymentLifecycleCheck(activity({ activityType: ActivityAuditType.Delete }))).toBe(false);
  });

  test('Create is not gated by the lifecycle check', () => {
    expect(needsDeploymentLifecycleCheck(activity({ activityType: ActivityAuditType.Create }))).toBe(false);
  });

  test('whitelist is never gated', () => {
    expect(
      needsDeploymentLifecycleCheck(
        activity({
          activityType: ActivityAuditType.Update,
          resourceType: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
        }),
      ),
    ).toBe(false);
  });

  test('returns false for a missing activity', () => {
    expect(needsDeploymentLifecycleCheck(undefined)).toBe(false);
  });
});
