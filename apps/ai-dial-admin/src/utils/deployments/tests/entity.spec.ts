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
    test('returns McpContainers for MCP', () => {
      expect(getRouteByType(IMAGE_TYPE.MCP)).toBe(ApplicationRoute.McpContainers);
    });
    test('returns InterceptorContainers for INTERCEPTOR', () => {
      expect(getRouteByType(IMAGE_TYPE.INTERCEPTOR)).toBe(ApplicationRoute.InterceptorContainers);
    });

    test('returns ModelServings for INTERCEPTOR', () => {
      expect(getRouteByType('any' as any)).toBe(ApplicationRoute.ModelServings);
    });
  });

  describe('getTranslatedDeploymentType', () => {
    test('returns EntitiesI18nKey.Serving for ModelServings', () => {
      expect(getTranslatedDeploymentType(ApplicationRoute.ModelServings, (t) => t)).toBe(EntitiesI18nKey.Serving);
    });

    test('returns EntitiesI18nKey.Container for InterceptorContainers', () => {
      expect(getTranslatedDeploymentType(ApplicationRoute.InterceptorContainers, (t) => t)).toBe(
        EntitiesI18nKey.Container,
      );
    });
  });

  describe('getEntityRoute', () => {
    test('returns Toolsets for McpContainers', () => {
      expect(getEntityRoute(ApplicationRoute.McpContainers)).toBe(ApplicationRoute.Toolsets);
    });
    test('returns Interceptors for InterceptorContainers', () => {
      expect(getEntityRoute(ApplicationRoute.InterceptorContainers)).toBe(ApplicationRoute.Interceptors);
    });
    test('returns Models for other routes', () => {
      expect(getEntityRoute(ApplicationRoute.ModelServings)).toBe(ApplicationRoute.Models);
    });
  });

  describe('getTranslatedType', () => {
    test('returns MCP for McpContainers', () => {
      expect(getTranslatedType(ApplicationRoute.McpContainers, t)).toBe(EntitiesI18nKey.MCP);
    });
    test('returns Interceptor for InterceptorContainers', () => {
      expect(getTranslatedType(ApplicationRoute.InterceptorContainers, t)).toBe(EntitiesI18nKey.Interceptor);
    });
    test('returns Model for other routes', () => {
      expect(getTranslatedType(ApplicationRoute.ModelServings, t)).toBe(EntitiesI18nKey.Model);
    });
  });

  describe('getTranslatedEntity', () => {
    test('returns Toolset for McpContainers', () => {
      expect(getTranslatedEntity(ApplicationRoute.McpContainers, t)).toBe(EntitiesI18nKey.Toolset);
    });
    test('returns Interceptor for Interceptors', () => {
      expect(getTranslatedEntity(ApplicationRoute.InterceptorContainers, t)).toBe(EntitiesI18nKey.Interceptor);
    });
    test('returns Model for other routes', () => {
      expect(getTranslatedEntity(ApplicationRoute.ModelServings, t)).toBe(EntitiesI18nKey.Model);
    });
  });

  describe('getIdFormat', () => {
    test('converts to lower case and replaces spaces with underscores', () => {
      expect(getIdFormat('My Entity Name')).toBe('my_entity_name');
    });
  });

  describe('getEntityId', () => {
    test('generates id based on container name and route', () => {
      const container = { displayName: 'MyContainer' } as any;
      expect(getEntityId(container, ApplicationRoute.ModelServings, t)).toBe('mycontainer_entities.model');
    });
  });

  describe('getEntityName', () => {
    test('generates name based on container name and route', () => {
      const container = { displayName: 'MyContainer' } as any;
      expect(getEntityName(container, ApplicationRoute.ModelServings, t)).toBe(
        `MyContainer ${EntitiesI18nKey.Model}`,
      );
    });
  });

  describe('getEntityTemplate', () => {
    test('returns basic template', () => {
      const container = { displayName: 'MyContainer', name: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.InterceptorContainers, container, t);
      expect(template.name).toBe('mycontainer_entities.interceptor');
      expect(template.source?.containerId).toBe('123');
    });

    test('configures model specific fields for ModelServings', () => {
      (getEndpointPostfix as any).mockReturnValue('/chat');
      const container = { displayName: 'MyContainer', name: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.ModelServings, container, t) as any;
      expect(template.type).toBe(DialModelType.Chat);
      expect(template.source.completionEndpointPath).toBe('openai/v1/chat');
    });

    test('configures transport for McpContainers', () => {
      const container = { displayName: 'MyContainer', name: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.McpContainers, container, t, CONTAINER_TRANSPORT.SSE) as any;
      expect(template.transport).toBe(ENTITY_TRANSPORT[CONTAINER_TRANSPORT.SSE]);
    });
  });

  describe('getAssetTemplate', () => {
    test('returns asset template', () => {
      const container = { displayName: 'MyContainer', url: 'http://url' } as any;
      const template = getAssetTemplate(ApplicationRoute.McpContainers, container, t, CONTAINER_TRANSPORT.SSE);
      expect(template.name).toBe('mycontainer_entities.toolset');
      expect(template.endpoint).toBe('http://url');
      expect(template.transport).toBe(CONTAINER_TRANSPORT.SSE);
    });

    test('configures transport for McpContainers', () => {
      const container = { displayName: 'MyContainer', url: 'http://url' } as any;
      const template = getAssetTemplate(ApplicationRoute.McpContainers, container, t, CONTAINER_TRANSPORT.SSE) as any;
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
