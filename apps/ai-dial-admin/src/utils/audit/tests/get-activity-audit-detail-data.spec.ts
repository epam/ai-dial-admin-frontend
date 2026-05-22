import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Token } from '@/src/models/auth';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

const activityAuditGetActivityByIdMock = vi.fn();
const activityAuditListMock = vi.fn().mockResolvedValue({ data: [], total: 0, totalPages: 0 });
const deploymentAuditGetActivityByIdMock = vi.fn();
const deploymentAuditListMock = vi.fn().mockResolvedValue({ data: [], total: 0, totalPages: 0 });
const containerGetRevisionDetailsMock = vi.fn().mockResolvedValue(null);
const imageGetRevisionDetailsMock = vi.fn().mockResolvedValue(null);
const firewallGetRevisionDetailsMock = vi.fn().mockResolvedValue(null);
const activityAuditGetRevisionDetailsMock = vi.fn().mockResolvedValue(null);

const containersGetContainerMock = vi.fn();
const imagesGetImageMock = vi.fn();

vi.mock('@/src/app/api/api', () => ({
  activityAuditApi: {
    getActivityById: (...args: unknown[]) => activityAuditGetActivityByIdMock(...args),
    getActivitiesList: (...args: unknown[]) => activityAuditListMock(...args),
    getRevisionDetails: (...args: unknown[]) => activityAuditGetRevisionDetailsMock(...args),
  },
  deploymentAuditApi: {
    getActivityById: (...args: unknown[]) => deploymentAuditGetActivityByIdMock(...args),
    getActivitiesList: (...args: unknown[]) => deploymentAuditListMock(...args),
  },
  containersApi: {
    getContainer: (...args: unknown[]) => containersGetContainerMock(...args),
    getRevisionDetails: (...args: unknown[]) => containerGetRevisionDetailsMock(...args),
  },
  imagesApi: {
    getImage: (...args: unknown[]) => imagesGetImageMock(...args),
    getRevisionDetails: (...args: unknown[]) => imageGetRevisionDetailsMock(...args),
  },
  globalFirewallApi: {
    getRevisionDetails: (...args: unknown[]) => firewallGetRevisionDetailsMock(...args),
  },
}));

vi.mock('@/src/server/logger', () => ({
  errorObjLog: vi.fn(),
}));

import { getActivityAuditDetailData } from '../get-activity-audit-detail-data';

const TOKEN = { token: 'abc' } as unknown as Token;

const buildActivity = (resourceType: ActivityAuditResourceType, resourceId = 'res-1') => ({
  activityType: ActivityAuditType.Update,
  resourceType,
  resourceId,
  epochTimestampMs: 1_776_000_000_000,
  initiatedAuthor: 'a',
  initiatedEmail: 'a@a',
  activityId: 'ax',
  revision: 5,
});

beforeEach(() => {
  activityAuditGetActivityByIdMock.mockReset();
  deploymentAuditGetActivityByIdMock.mockReset();
  containersGetContainerMock.mockReset();
  imagesGetImageMock.mockReset();
  activityAuditListMock.mockClear();
  deploymentAuditListMock.mockClear();
});

describe('getActivityAuditDetailData :: currentResourceStatus', () => {
  test('populates status from containersApi.getContainer for container-deployment activities', async () => {
    const activity = buildActivity(ActivityAuditResourceType.ADAPTER_DEPLOYMENT, 'dep-1');
    activityAuditGetActivityByIdMock.mockResolvedValue({ success: false, response: null });
    deploymentAuditGetActivityByIdMock.mockResolvedValue({ success: true, response: activity });
    containersGetContainerMock.mockResolvedValue({ success: true, response: { status: CONTAINER_STATUS.STOPPED } });

    const result = await getActivityAuditDetailData('ax', TOKEN);

    expect(containersGetContainerMock).toHaveBeenCalledWith('dep-1', TOKEN);
    expect(result.currentResourceStatus).toBe(CONTAINER_STATUS.STOPPED);
  });

  test('populates status from imagesApi.getImage for image-definition activities', async () => {
    const activity = buildActivity(ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION, 'img-1');
    activityAuditGetActivityByIdMock.mockResolvedValue({ success: false, response: null });
    deploymentAuditGetActivityByIdMock.mockResolvedValue({ success: true, response: activity });
    imagesGetImageMock.mockResolvedValue({ success: true, response: { buildStatus: IMAGE_STATUS.BUILD_FAILED } });

    const result = await getActivityAuditDetailData('ax', TOKEN);

    expect(imagesGetImageMock).toHaveBeenCalledWith('img-1', TOKEN);
    expect(result.currentResourceStatus).toBe(IMAGE_STATUS.BUILD_FAILED);
  });

  test('leaves currentResourceStatus undefined for whitelist activities', async () => {
    const activity = buildActivity(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, '');
    activityAuditGetActivityByIdMock.mockResolvedValue({ success: false, response: null });
    deploymentAuditGetActivityByIdMock.mockResolvedValue({ success: true, response: activity });

    const result = await getActivityAuditDetailData('ax', TOKEN);

    expect(containersGetContainerMock).not.toHaveBeenCalled();
    expect(imagesGetImageMock).not.toHaveBeenCalled();
    expect(result.currentResourceStatus).toBeUndefined();
  });

  test('leaves currentResourceStatus undefined for config activities', async () => {
    const activity = buildActivity(ActivityAuditResourceType.MODEL, 'm-1');
    activityAuditGetActivityByIdMock.mockResolvedValue({ success: true, response: activity });

    const result = await getActivityAuditDetailData('ax', TOKEN);

    expect(containersGetContainerMock).not.toHaveBeenCalled();
    expect(imagesGetImageMock).not.toHaveBeenCalled();
    expect(result.currentResourceStatus).toBeUndefined();
  });

  test('leaves currentResourceStatus undefined when the live fetch fails', async () => {
    const activity = buildActivity(ActivityAuditResourceType.MCP_DEPLOYMENT, 'dep-x');
    activityAuditGetActivityByIdMock.mockResolvedValue({ success: false, response: null });
    deploymentAuditGetActivityByIdMock.mockResolvedValue({ success: true, response: activity });
    containersGetContainerMock.mockRejectedValue(new Error('boom'));

    const result = await getActivityAuditDetailData('ax', TOKEN);

    expect(result.currentResourceStatus).toBeUndefined();
  });
});
