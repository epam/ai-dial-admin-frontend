import { describe, expect, test, vi } from 'vitest';
import {
  getAssetTemplate,
  getEntityId,
  getEntityName,
  getEntityRoute,
  getEntityTemplate,
  getIdFormat,
  getRouteByType,
  getTranslatedDeploymentType,
  getTranslatedEntity,
  getTranslatedType,
  splitFolderId,
} from '../entity';
import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { ENTITY_TRANSPORT } from '@/src/constants/deployments/containers';
import { DialModelType } from '@/src/models/dial/model';
import { IMAGE_TYPE } from '../../../types/deployments/images';

vi.mock('@/src/utils/models/model-endpoint');

describe('entity utils', () => {
  const t = (key: string) => key;

  describe('getRouteByType', () => {
    test('returns McpDeployments for MCP', () => {
      expect(getRouteByType(IMAGE_TYPE.MCP)).toBe(ApplicationRoute.McpDeployments);
    });
    test('returns InterceptorDeployments for INTERCEPTOR', () => {
      expect(getRouteByType(IMAGE_TYPE.INTERCEPTOR)).toBe(ApplicationRoute.InterceptorDeployments);
    });

    test('returns ModelDeployments for INTERCEPTOR', () => {
      expect(getRouteByType('any' as any)).toBe(ApplicationRoute.ModelDeployments);
    });
  });

  describe('getTranslatedDeploymentType', () => {
    test('returns EntitiesI18nKey.Serving for ModelDeployments', () => {
      expect(getTranslatedDeploymentType(ApplicationRoute.ModelDeployments, (t) => t)).toBe(EntitiesI18nKey.Serving);
    });

    test('returns EntitiesI18nKey.Container for InterceptorDeployments', () => {
      expect(getTranslatedDeploymentType(ApplicationRoute.InterceptorDeployments, (t) => t)).toBe(
        EntitiesI18nKey.Container,
      );
    });
  });

  describe('getEntityRoute', () => {
    test('returns Toolsets for McpDeployments', () => {
      expect(getEntityRoute(ApplicationRoute.McpDeployments)).toBe(ApplicationRoute.Toolsets);
    });
    test('returns Interceptors for InterceptorDeployments', () => {
      expect(getEntityRoute(ApplicationRoute.InterceptorDeployments)).toBe(ApplicationRoute.Interceptors);
    });
    test('returns Models for other routes', () => {
      expect(getEntityRoute(ApplicationRoute.ModelDeployments)).toBe(ApplicationRoute.Models);
    });
  });

  describe('getTranslatedType', () => {
    test('returns MCP for McpDeployments', () => {
      expect(getTranslatedType(ApplicationRoute.McpDeployments, t)).toBe(EntitiesI18nKey.MCP);
    });
    test('returns Interceptor for InterceptorDeployments', () => {
      expect(getTranslatedType(ApplicationRoute.InterceptorDeployments, t)).toBe(EntitiesI18nKey.Interceptor);
    });
    test('returns Model for other routes', () => {
      expect(getTranslatedType(ApplicationRoute.ModelDeployments, t)).toBe(EntitiesI18nKey.Model);
    });
  });

  describe('getTranslatedEntity', () => {
    test('returns Toolset for McpDeployments', () => {
      expect(getTranslatedEntity(ApplicationRoute.McpDeployments, t)).toBe(EntitiesI18nKey.Toolset);
    });
    test('returns Interceptor for Interceptors', () => {
      expect(getTranslatedEntity(ApplicationRoute.InterceptorDeployments, t)).toBe(EntitiesI18nKey.Interceptor);
    });
    test('returns Model for other routes', () => {
      expect(getTranslatedEntity(ApplicationRoute.ModelDeployments, t)).toBe(EntitiesI18nKey.Model);
    });
  });

  describe('getIdFormat', () => {
    test('converts to lower case and replaces spaces with underscores', () => {
      expect(getIdFormat('My Entity Name')).toBe('my_entity_name');
    });
  });

  describe('getEntityId', () => {
    test('generates id based on container name and route', () => {
      const container = { name: 'MyContainer' } as any;
      expect(getEntityId(container, ApplicationRoute.ModelDeployments, t)).toBe('mycontainer_entities.model');
    });
  });

  describe('getEntityName', () => {
    test('generates name based on container name and route', () => {
      const container = { name: 'MyContainer' } as any;
      expect(getEntityName(container, ApplicationRoute.ModelDeployments, t)).toBe(
        `MyContainer ${EntitiesI18nKey.Model}`,
      );
    });
  });

  describe('getEntityTemplate', () => {
    test('returns basic template', () => {
      const container = { name: 'MyContainer', id: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.InterceptorDeployments, container, t);
      expect(template.name).toBe('mycontainer_entities.interceptor');
      expect(template.source?.containerId).toBe('123');
    });

    test('configures model specific fields for ModelDeployments', () => {
      (getEndpointPostfix as any).mockReturnValue('/chat');
      const container = { name: 'MyContainer', id: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.ModelDeployments, container, t) as any;
      expect(template.type).toBe(DialModelType.Chat);
      expect(template.source.completionEndpointPath).toBe('mycontainer_entities.model/chat');
    });

    test('configures transport for McpDeployments', () => {
      const container = { name: 'MyContainer', id: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.McpDeployments, container, t, CONTAINER_TRANSPORT.SSE) as any;
      expect(template.transport).toBe(ENTITY_TRANSPORT[CONTAINER_TRANSPORT.SSE]);
    });
  });

  describe('getAssetTemplate', () => {
    test('returns asset template', () => {
      const container = { name: 'MyContainer', url: 'http://url' } as any;
      const template = getAssetTemplate(ApplicationRoute.McpDeployments, container, t, CONTAINER_TRANSPORT.SSE);
      expect(template.name).toBe('mycontainer_entities.toolset');
      expect(template.endpoint).toBe('http://url');
      expect(template.transport).toBe(CONTAINER_TRANSPORT.SSE);
    });

    test('configures transport for McpDeployments', () => {
      const container = { name: 'MyContainer', url: 'http://url' } as any;
      const template = getAssetTemplate(ApplicationRoute.McpDeployments, container, t, CONTAINER_TRANSPORT.SSE) as any;
      expect(template.transport).toBe(ENTITY_TRANSPORT[CONTAINER_TRANSPORT.SSE]);
    });
  });

  describe('splitFolderId', () => {
    test('splits folder id into base and path', () => {
      expect(splitFolderId('bucket/folder/subfolder/')).toEqual({
        base: 'bucket/',
        path: 'folder/subfolder/',
      });
    });

    test('handles root folder', () => {
      expect(splitFolderId('bucket/')).toEqual({
        base: 'bucket/',
        path: '',
      });
    });

    test('handles root folder', () => {
      expect(splitFolderId('bucket')).toEqual({
        base: 'bucket/',
        path: '',
      });
    });
  });
});
