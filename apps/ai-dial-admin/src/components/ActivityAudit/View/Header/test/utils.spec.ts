import { describe, expect, test } from 'vitest';

import { BaseEntity } from '@/src/models/dial/base-entity';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import { getAuditResourceHref, resolveEntityAuditType } from '../utils';

describe('resolveEntityAuditType', () => {
  test('resolves NIM container to NimDeployment', () => {
    const container = { $type: CONTAINER_TYPE.NIM, name: 'gpt-4' } as Container;
    expect(resolveEntityAuditType(container, ApplicationRoute.ModelServings)).toBe(
      ActivityAuditResourceType.NIM_DEPLOYMENT,
    );
  });

  test('resolves Inference (HF) container to InferenceDeployment', () => {
    const container = { $type: CONTAINER_TYPE.HF, name: 'llama-3' } as Container;
    expect(resolveEntityAuditType(container, ApplicationRoute.ModelServings)).toBe(
      ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
    );
  });

  test('resolves MCP container to McpDeployment', () => {
    const container = { $type: CONTAINER_TYPE.MCP, name: 'mcp-server' } as Container;
    expect(resolveEntityAuditType(container, ApplicationRoute.McpContainers)).toBe(
      ActivityAuditResourceType.MCP_DEPLOYMENT,
    );
  });

  test('resolves Adapter / Application / Interceptor containers to their audit types', () => {
    const adapter = { $type: CONTAINER_TYPE.ADAPTER, name: 'a' } as Container;
    const application = { $type: CONTAINER_TYPE.APPLICATION, name: 'b' } as Container;
    const interceptor = { $type: CONTAINER_TYPE.INTERCEPTOR, name: 'c' } as Container;

    expect(resolveEntityAuditType(adapter, ApplicationRoute.AdapterContainers)).toBe(
      ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
    );
    expect(resolveEntityAuditType(application, ApplicationRoute.ApplicationContainers)).toBe(
      ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
    );
    expect(resolveEntityAuditType(interceptor, ApplicationRoute.InterceptorContainers)).toBe(
      ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
    );
  });

  test('resolves image $type to the matching image-definition audit type', () => {
    const mcpImage = { $type: IMAGE_TYPE.MCP, name: 'img' } as Image;
    const adapterImage = { $type: IMAGE_TYPE.ADAPTER, name: 'img' } as Image;
    const appImage = { $type: IMAGE_TYPE.APPLICATION, name: 'img' } as Image;
    const interceptorImage = { $type: IMAGE_TYPE.INTERCEPTOR, name: 'img' } as Image;

    expect(resolveEntityAuditType(mcpImage, ApplicationRoute.Images)).toBe(
      ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
    );
    expect(resolveEntityAuditType(adapterImage, ApplicationRoute.Images)).toBe(
      ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    );
    expect(resolveEntityAuditType(appImage, ApplicationRoute.Images)).toBe(
      ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    );
    expect(resolveEntityAuditType(interceptorImage, ApplicationRoute.Images)).toBe(
      ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    );
  });

  test('falls back to routeAuditResource for admin entities without $type', () => {
    const adminEntity = { name: 'gpt-4' } as BaseEntity;
    expect(resolveEntityAuditType(adminEntity, ApplicationRoute.Models)).toBe(ActivityAuditResourceType.MODEL);
    expect(resolveEntityAuditType(adminEntity, ApplicationRoute.Toolsets)).toBe(ActivityAuditResourceType.TOOLSET);
  });

  test('returns undefined when entity has no $type and route is not in routeAuditResource', () => {
    const adminEntity = { name: 'x' } as BaseEntity;
    expect(resolveEntityAuditType(adminEntity, ApplicationRoute.Dashboard)).toBeUndefined();
  });

  test('returns undefined when entity is undefined and route is not mapped', () => {
    expect(resolveEntityAuditType(undefined, ApplicationRoute.Dashboard)).toBeUndefined();
  });
});

describe('getAuditResourceHref', () => {
  test('resolves a table activity to its table page', () => {
    expect(getAuditResourceHref(ActivityAuditResourceType.TABLE, 'orders')).toBe('/tables/orders');
  });

  test('resolves a column activity to the page of the table its identifier carries', () => {
    expect(getAuditResourceHref(ActivityAuditResourceType.TABLE_COLUMN, 'orders:total')).toBe('/tables/orders');
  });

  test('resolves a pipeline and a saved query to their own pages', () => {
    expect(getAuditResourceHref(ActivityAuditResourceType.PIPELINE, 'daily-load')).toBe('/pipelines/daily-load');
    expect(getAuditResourceHref(ActivityAuditResourceType.SAVED_QUERY, 'q-1')).toBe('/queries/q-1');
  });

  test('resolves a non-analytics type through the shared auditResourceRoute map', () => {
    expect(getAuditResourceHref(ActivityAuditResourceType.MODEL, 'gpt-4')).toBe('/models/gpt-4');
    expect(getAuditResourceHref(ActivityAuditResourceType.MCP_DEPLOYMENT, 'mcp-1')).toBe('/mcp-containers/mcp-1');
  });

  test('encodes the resource identifier in both the analytics and the shared branch', () => {
    expect(getAuditResourceHref(ActivityAuditResourceType.TABLE, 'my orders/2024')).toBe('/tables/my%20orders%2F2024');
    expect(getAuditResourceHref(ActivityAuditResourceType.MODEL, 'gpt 4/turbo')).toBe('/models/gpt%204%2Fturbo');
  });

  test('returns undefined for a resource type with no known route', () => {
    expect(getAuditResourceHref(ActivityAuditResourceType.ADMIN_PROPERTIES, 'settings')).toBeUndefined();
    expect(getAuditResourceHref('BrandNewBackendType' as ActivityAuditResourceType, 'whatever')).toBeUndefined();
  });

  test('returns undefined when the resource type or the resource identifier is missing', () => {
    expect(getAuditResourceHref(undefined, 'orders')).toBeUndefined();
    expect(getAuditResourceHref(ActivityAuditResourceType.TABLE, undefined)).toBeUndefined();
    expect(getAuditResourceHref(ActivityAuditResourceType.TABLE, '')).toBeUndefined();
  });

  test('returns undefined for a column identifier with no table half', () => {
    expect(getAuditResourceHref(ActivityAuditResourceType.TABLE_COLUMN, ':total')).toBeUndefined();
  });
});
