import { describe, expect, test, vi } from 'vitest';
import {
  getAssetTemplate,
  getEntityId,
  getEntityName,
  getEntityTemplate,
  getIdFormat,
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

vi.mock('@/src/utils/models/model-endpoint');

describe('entity utils', () => {
  const t = (key: string) => key;

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
      const template = getAssetTemplate(ApplicationRoute.McpDeployments, container, t);
      expect(template.name).toBe('mycontainer_entities.toolset');
      expect(template.endpoint).toBe('http://url');
      expect(template.version).toBe('1.0.0');
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
  });
});
