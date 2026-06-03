import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { buildCreateBodyFromSnapshot } from '../build-create-body-from-snapshot';

const containerSnapshot = () => ({
  $type: 'mcp',
  id: 'dep-1',
  name: 'my-deployment',
  displayName: 'My Deployment',
  status: 'running',
  url: 'https://example.com',
  author: 'someone@epam.com',
  createdAt: 1000,
  updatedAt: 2000,
  source: {
    $type: 'internal_image',
    imageDefinitionId: 'img-1',
    imageDefinitionName: 'img',
    imageDefinitionVersion: '1',
  },
  metadata: { envs: [{ name: 'SECRET', mountType: 'secure_file', value: { value: null } }] },
  resources: { CPU_REQUEST: '1' },
});

describe('buildCreateBodyFromSnapshot', () => {
  test('keeps $type that the diff layer hides', () => {
    const body = buildCreateBodyFromSnapshot(containerSnapshot(), ActivityAuditResourceType.MCP_DEPLOYMENT);
    expect(body.$type).toBe('mcp');
  });

  test('drops server-managed and runtime fields for containers', () => {
    const body = buildCreateBodyFromSnapshot(containerSnapshot(), ActivityAuditResourceType.MCP_DEPLOYMENT);
    expect(body.id).toBeUndefined();
    expect(body.createdAt).toBeUndefined();
    expect(body.updatedAt).toBeUndefined();
    expect(body.status).toBeUndefined();
    expect(body.url).toBeUndefined();
    expect(body.author).toBeUndefined();
  });

  test('preserves the raw source for an internal-image container', () => {
    const snapshot = containerSnapshot();
    const body = buildCreateBodyFromSnapshot(snapshot, ActivityAuditResourceType.MCP_DEPLOYMENT);
    expect(body.source).toEqual(snapshot.source);
  });

  test('passes through masked/null secure env values', () => {
    const body = buildCreateBodyFromSnapshot(containerSnapshot(), ActivityAuditResourceType.MCP_DEPLOYMENT) as {
      metadata: { envs: { value: { value: string | null } }[] };
    };
    expect(body.metadata.envs[0].value.value).toBeNull();
  });

  test('does not mutate the input snapshot', () => {
    const snapshot = containerSnapshot();
    buildCreateBodyFromSnapshot(snapshot, ActivityAuditResourceType.MCP_DEPLOYMENT);
    expect(snapshot.id).toBe('dep-1');
    expect(snapshot.status).toBe('running');
  });

  test('drops build status for image definitions', () => {
    const snapshot = {
      $type: 'mcp',
      id: 'img-1',
      name: 'image',
      buildStatus: 'build_successful',
      status: 'build_successful',
      createdAt: 1,
      updatedAt: 2,
      source: { $type: 'docker' },
    };
    const body = buildCreateBodyFromSnapshot(snapshot, ActivityAuditResourceType.MCP_IMAGE_DEFINITION);
    expect(body.$type).toBe('mcp');
    expect(body.source).toEqual(snapshot.source);
    expect(body.id).toBeUndefined();
    expect(body.buildStatus).toBeUndefined();
    expect(body.status).toBeUndefined();
  });

  test('returns empty object for null snapshot', () => {
    expect(buildCreateBodyFromSnapshot(null, ActivityAuditResourceType.MCP_DEPLOYMENT)).toEqual({});
  });
});
