import { RollbackI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { describe, expect, test } from 'vitest';
import { getRollbackBlockReason } from '../get-rollback-block-reason';

const CONTAINER = ActivityAuditResourceType.MCP_DEPLOYMENT;
const IMAGE = ActivityAuditResourceType.MCP_IMAGE_DEFINITION;
const WHITELIST = ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST;

describe('getRollbackBlockReason', () => {
  test('blocks active container statuses', () => {
    for (const status of [
      CONTAINER_STATUS.PENDING,
      CONTAINER_STATUS.RUNNING,
      CONTAINER_STATUS.FAILED,
      CONTAINER_STATUS.STOPPING,
    ]) {
      expect(getRollbackBlockReason(CONTAINER, { status })).toBe(RollbackI18nKey.BlockedActiveDeployment);
    }
  });

  test('allows inactive container statuses', () => {
    expect(getRollbackBlockReason(CONTAINER, { status: CONTAINER_STATUS.NOT_DEPLOYED })).toBeNull();
    expect(getRollbackBlockReason(CONTAINER, { status: CONTAINER_STATUS.STOPPED })).toBeNull();
  });

  test('blocks building/built image statuses', () => {
    expect(getRollbackBlockReason(IMAGE, { buildStatus: IMAGE_STATUS.BUILDING })).toBe(
      RollbackI18nKey.BlockedImageBuilding,
    );
    expect(getRollbackBlockReason(IMAGE, { buildStatus: IMAGE_STATUS.BUILT })).toBe(
      RollbackI18nKey.BlockedImageBuilding,
    );
  });

  test('allows non-active image statuses', () => {
    expect(getRollbackBlockReason(IMAGE, { buildStatus: IMAGE_STATUS.NOT_BUILT })).toBeNull();
    expect(getRollbackBlockReason(IMAGE, { buildStatus: IMAGE_STATUS.BUILD_FAILED })).toBeNull();
    expect(getRollbackBlockReason(IMAGE, { buildStatus: IMAGE_STATUS.BUILD_STOPPED })).toBeNull();
  });

  test('whitelist is never blocked', () => {
    expect(getRollbackBlockReason(WHITELIST, { status: CONTAINER_STATUS.RUNNING })).toBeNull();
  });

  test('returns null when state is unavailable', () => {
    expect(getRollbackBlockReason(CONTAINER, null)).toBeNull();
    expect(getRollbackBlockReason(CONTAINER, undefined)).toBeNull();
  });
});
