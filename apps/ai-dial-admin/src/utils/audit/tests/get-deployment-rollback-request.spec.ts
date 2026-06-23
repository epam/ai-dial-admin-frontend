import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/src/app/actions/deployments', () => ({
  rollbackDeploymentContainer: vi.fn(() => Promise.resolve({ success: true })),
  rollbackDeploymentImage: vi.fn(() => Promise.resolve({ success: true })),
  rollbackDeploymentWhitelist: vi.fn(() => Promise.resolve({ success: true })),
  deleteContainer: vi.fn(() => Promise.resolve({ success: true })),
  deleteImage: vi.fn(() => Promise.resolve({ success: true })),
  getDeploymentRevisionDetails: vi.fn(() => Promise.resolve({ id: 'snap-id', name: 'snap-name', $type: 'mcp' })),
}));

import {
  deleteContainer,
  deleteImage,
  getDeploymentRevisionDetails,
  rollbackDeploymentContainer,
  rollbackDeploymentImage,
  rollbackDeploymentWhitelist,
} from '@/src/app/actions/deployments';
import { rollbackDeploymentEntity } from '../get-deployment-rollback-request';

const activity = (overrides: Partial<DialActivity>): DialActivity =>
  ({
    activityType: ActivityAuditType.Update,
    resourceType: ActivityAuditResourceType.MCP_DEPLOYMENT,
    resourceId: 'dep-1',
    revision: 42,
    activityId: 'a1',
    ...overrides,
  }) as DialActivity;

describe('rollbackDeploymentEntity', () => {
  beforeEach(() => vi.clearAllMocks());

  test('Update on container calls the container rollback endpoint at revision - 1', async () => {
    await rollbackDeploymentEntity(activity({ activityType: ActivityAuditType.Update }));
    expect(rollbackDeploymentContainer).toHaveBeenCalledWith('dep-1', 41);
  });

  test('Update on image calls the image rollback endpoint at revision - 1', async () => {
    await rollbackDeploymentEntity(
      activity({
        activityType: ActivityAuditType.Update,
        resourceType: ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
      }),
    );
    expect(rollbackDeploymentImage).toHaveBeenCalledWith('dep-1', 41);
  });

  test('Create on container deletes the entity', async () => {
    await rollbackDeploymentEntity(activity({ activityType: ActivityAuditType.Create }));
    expect(deleteContainer).toHaveBeenCalledWith('snap-name');
    expect(rollbackDeploymentContainer).not.toHaveBeenCalled();
  });

  test('Create on image deletes by id', async () => {
    await rollbackDeploymentEntity(
      activity({
        activityType: ActivityAuditType.Create,
        resourceType: ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
      }),
    );
    expect(deleteImage).toHaveBeenCalledWith('snap-id');
  });

  test('Delete on container calls the container rollback endpoint at revision - 1', async () => {
    await rollbackDeploymentEntity(activity({ activityType: ActivityAuditType.Delete }));
    expect(rollbackDeploymentContainer).toHaveBeenCalledWith('dep-1', 41);
    expect(getDeploymentRevisionDetails).not.toHaveBeenCalled();
    expect(deleteContainer).not.toHaveBeenCalled();
  });

  test('Delete on image calls the image rollback endpoint at revision - 1', async () => {
    await rollbackDeploymentEntity(
      activity({
        activityType: ActivityAuditType.Delete,
        resourceType: ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
      }),
    );
    expect(rollbackDeploymentImage).toHaveBeenCalledWith('dep-1', 41);
    expect(getDeploymentRevisionDetails).not.toHaveBeenCalled();
  });

  test('whitelist always rolls back via the whitelist endpoint without an id', async () => {
    await rollbackDeploymentEntity(
      activity({
        activityType: ActivityAuditType.Update,
        resourceType: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      }),
    );
    expect(rollbackDeploymentWhitelist).toHaveBeenCalledWith(41);
    expect(rollbackDeploymentContainer).not.toHaveBeenCalled();
  });
});
