import { describe, expect, test, vi, beforeEach } from 'vitest';

import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';

const rollbackContainerToRevisionMock = vi.fn();
const rollbackImageDefinitionToRevisionMock = vi.fn();
const rollbackImageBuildWhitelistToRevisionMock = vi.fn();
const updateModelMock = vi.fn();

vi.mock('@/src/app/actions/deployments', () => ({
  rollbackContainerToRevision: (...args: unknown[]) => rollbackContainerToRevisionMock(...args),
  rollbackImageDefinitionToRevision: (...args: unknown[]) => rollbackImageDefinitionToRevisionMock(...args),
  rollbackImageBuildWhitelistToRevision: (...args: unknown[]) => rollbackImageBuildWhitelistToRevisionMock(...args),
}));

vi.mock('@/src/app/[lang]/activity-audit/actions', () => ({
  getRevisionDetails: vi.fn(),
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  createModel: vi.fn(),
  removeModel: vi.fn(),
  updateModel: (...args: unknown[]) => updateModelMock(...args),
}));

vi.mock('@/src/app/[lang]/adapters/actions', () => ({
  createAdapter: () => undefined,
  removeAdapter: () => undefined,
  updateAdapter: () => undefined,
}));
vi.mock('@/src/app/[lang]/applications/actions', () => ({
  createApplication: () => undefined,
  removeApplication: () => undefined,
  updateApplication: () => undefined,
}));
vi.mock('@/src/app/[lang]/interceptors/actions', () => ({
  createInterceptor: () => undefined,
  removeInterceptor: () => undefined,
  updateInterceptor: () => undefined,
}));
vi.mock('@/src/app/[lang]/interceptor-templates/actions', () => ({
  createInterceptorTemplate: () => undefined,
  deleteInterceptorTemplate: () => undefined,
  updateInterceptorTemplate: () => undefined,
}));
vi.mock('@/src/app/[lang]/keys/actions', () => ({
  createKey: () => undefined,
  removeKey: () => undefined,
  updateKey: () => undefined,
}));
vi.mock('@/src/app/[lang]/roles/actions', () => ({
  createRole: () => undefined,
  removeRole: () => undefined,
  updateRole: () => undefined,
}));
vi.mock('@/src/app/[lang]/routes/actions', () => ({
  createRoute: () => undefined,
  removeRoute: () => undefined,
  updateRoute: () => undefined,
}));
vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  createApplicationScheme: () => undefined,
  removeApplicationScheme: () => undefined,
  updateApplicationScheme: () => undefined,
}));
vi.mock('@/src/app/[lang]/toolsets/actions', () => ({
  createToolset: () => undefined,
  removeToolset: () => undefined,
  updateToolset: () => undefined,
}));

import { rollbackEntityPerRevision, rollbackEntityPerType } from '../get-rollback-request';

const buildActivity = (resourceType: ActivityAuditResourceType, resourceId = 'res-id'): DialActivity => ({
  activityType: ActivityAuditType.Update,
  resourceType,
  resourceId,
  epochTimestampMs: 1_776_000_000_000,
  initiatedAuthor: 'john.doe',
  initiatedEmail: 'john.doe@example.com',
  activityId: '019606d8-a1b2-7000-8000-abcdef123456',
  revision: 7,
});

beforeEach(() => {
  rollbackContainerToRevisionMock.mockReset();
  rollbackImageDefinitionToRevisionMock.mockReset();
  rollbackImageBuildWhitelistToRevisionMock.mockReset();
  updateModelMock.mockReset();
});

describe('rollbackEntityPerRevision :: deployment-manager branch', () => {
  test.each([
    ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
    ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
    ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
    ActivityAuditResourceType.MCP_DEPLOYMENT,
    ActivityAuditResourceType.NIM_DEPLOYMENT,
    ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
  ])('routes container deployment %s to rollbackContainerToRevision with activity.revision - 1', async (type) => {
    await rollbackEntityPerRevision(buildActivity(type, 'dep-1'), null, null);
    expect(rollbackContainerToRevisionMock).toHaveBeenCalledWith('dep-1', 6);
    expect(rollbackImageDefinitionToRevisionMock).not.toHaveBeenCalled();
    expect(rollbackImageBuildWhitelistToRevisionMock).not.toHaveBeenCalled();
    expect(updateModelMock).not.toHaveBeenCalled();
  });

  test.each([
    ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
  ])('routes image definition %s to rollbackImageDefinitionToRevision', async (type) => {
    await rollbackEntityPerRevision(buildActivity(type, 'img-1'), null, null);
    expect(rollbackImageDefinitionToRevisionMock).toHaveBeenCalledWith('img-1', 6);
    expect(rollbackContainerToRevisionMock).not.toHaveBeenCalled();
  });

  test('routes whitelist activity to rollbackImageBuildWhitelistToRevision without id', async () => {
    await rollbackEntityPerRevision(
      buildActivity(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, ''),
      null,
      null,
    );
    expect(rollbackImageBuildWhitelistToRevisionMock).toHaveBeenCalledWith(6);
    expect(rollbackContainerToRevisionMock).not.toHaveBeenCalled();
    expect(rollbackImageDefinitionToRevisionMock).not.toHaveBeenCalled();
  });

  test('config-entity activity still hits the CRUD replay path', async () => {
    const activity = buildActivity(ActivityAuditResourceType.MODEL, 'm-1');
    await rollbackEntityPerRevision(activity, null, { name: 'snap' });
    expect(updateModelMock).toHaveBeenCalled();
    expect(rollbackContainerToRevisionMock).not.toHaveBeenCalled();
  });
});

describe('rollbackEntityPerType :: deployment-manager branch', () => {
  test('routes deployment-manager activity through the dedicated action even if reached from a row action', async () => {
    await rollbackEntityPerType(buildActivity(ActivityAuditResourceType.ADAPTER_DEPLOYMENT, 'dep-2'));
    expect(rollbackContainerToRevisionMock).toHaveBeenCalledWith('dep-2', 6);
  });
});
