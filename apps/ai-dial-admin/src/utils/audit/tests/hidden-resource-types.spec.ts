import { describe, expect, test } from 'vitest';

import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { isHiddenResourceType } from '@/src/utils/audit/hidden-resource-types';

describe('isHiddenResourceType', () => {
  test('hides the removed NimDeployment type', () => {
    expect(isHiddenResourceType('NimDeployment')).toBe(true);
  });

  test('keeps every supported resource type', () => {
    expect(Object.values(ActivityAuditResourceType).some(isHiddenResourceType)).toBe(false);
  });

  test('keeps an activity without a resource type', () => {
    expect(isHiddenResourceType(undefined)).toBe(false);
  });
});
