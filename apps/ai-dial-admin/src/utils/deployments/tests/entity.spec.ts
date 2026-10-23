import { describe, expect, test, vi } from 'vitest';
import {
  getAssetTemplate,
  getAssetView,
  getCurrentPolicy,
  getDeploymentEntityKey,
  getEntityId,
  getEntityName,
  getEntityRoute,
  getEntityTemplate,
  getIdFormat,
  getRouteByType,
  getTranslatedAssetEntity,
  getTranslatedAssetOption,
  getTranslatedDeploymentType,
  getTranslatedEntity,
  getTranslatedType,
  splitFolderId,
} from '../entity';
import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { getEndpointPostfix, getEndpointPrefix } from '@/src/utils/models/model-endpoint';
import { CONTAINER_TRANSPORT, CONTAINER_TYPE, INFERENCE_TASK } from '@/src/types/deployments/containers';
import { ENTITY_TRANSPORT, SERVING_MCP_ENDPOINT_PATH } from '@/src/constants/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { DialModelResourceType } from '@/src/models/dial/resource';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ToolsetTransport } from '@/src/types/toolset';
import { DialModelType } from '@/src/models/dial/model';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { WHITELIST_POLICY } from '@/src/types/deployments/entity';

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

    test('returns AdapterContainers for ADAPTER', () => {
      expect(getRouteByType(IMAGE_TYPE.ADAPTER)).toBe(ApplicationRoute.AdapterContainers);
    });

    test('returns ApplicationContainers for APPLICATION', () => {
      expect(getRouteByType(IMAGE_TYPE.APPLICATION)).toBe(ApplicationRoute.ApplicationContainers);
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
    test('returns Adapters for AdapterContainers', () => {
      expect(getEntityRoute(ApplicationRoute.AdapterContainers)).toBe(ApplicationRoute.Adapters);
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
    test('returns Adapter for AdapterContainers', () => {
      expect(getTranslatedType(ApplicationRoute.AdapterContainers, t)).toBe(EntitiesI18nKey.Adapter);
    });
    test('returns Application for ApplicationContainers', () => {
      expect(getTranslatedType(ApplicationRoute.ApplicationContainers, t)).toBe(EntitiesI18nKey.Application);
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
    test('returns Adapter for Adapters', () => {
      expect(getTranslatedEntity(ApplicationRoute.AdapterContainers, t)).toBe(EntitiesI18nKey.Adapter);
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
      expect(getEntityId(container)).toBe('mycontainer');
    });
  });

  describe('getEntityName', () => {
    test('generates name based on container name and route', () => {
      const container = { displayName: 'MyContainer' } as any;
      expect(getEntityName(container)).toBe(`MyContainer`);
    });
  });

  describe('getEntityTemplate', () => {
    test('returns basic template', () => {
      const container = { displayName: 'MyContainer', name: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.InterceptorContainers, container, t);
      expect(template.name).toBe('mycontainer');
      expect(template.source?.containerId).toBe('123');
    });

    test('uses openai/v1 prefix for HF (inference) ModelServings container', () => {
      (getEndpointPostfix as any).mockReturnValue('/chat');
      (getEndpointPrefix as any).mockReturnValue('openai/v1');
      const container = { displayName: 'MyContainer', name: '123', $type: CONTAINER_TYPE.HF } as any;
      const template = getEntityTemplate(ApplicationRoute.ModelServings, container, t) as any;
      expect(template.type).toBe(DialModelType.Chat);
      expect(template.source.completionEndpointPath).toBe('openai/v1/chat');
    });

    test('builds a fixed MCP toolset template for a TEXT_CLASSIFICATION ModelServings container', () => {
      const container = {
        displayName: 'MyContainer',
        name: '123',
        $type: CONTAINER_TYPE.HF,
        inferenceTask: INFERENCE_TASK.TEXT_CLASSIFICATION,
      } as any;
      const template = getEntityTemplate(ApplicationRoute.ModelServings, container, t) as any;
      expect(template.transport).toBe(ToolsetTransport.HTTP);
      expect(template.source.$type).toBe(SOURCE_TYPE.CONTAINER);
      expect(template.source.containerId).toBe('123');
      expect(template.source.completionEndpointPath).toBe('/mcp');
      expect(template.source.mcpEndpointPath).toBeUndefined();
      expect(template.type).toBeUndefined();
    });

    test('configures transport for McpContainers', () => {
      const container = { displayName: 'MyContainer', name: '123' } as any;
      const template = getEntityTemplate(ApplicationRoute.McpContainers, container, t, CONTAINER_TRANSPORT.SSE) as any;
      expect(template.transport).toBe(ENTITY_TRANSPORT[CONTAINER_TRANSPORT.SSE]);
    });

    test('configures baseEndpoint for AdapterContainers', () => {
      const container = { displayName: 'MyContainer', url: 'http://url' } as any;
      const template = getEntityTemplate(ApplicationRoute.AdapterContainers, container, t) as any;
      expect(template.source.completionEndpointPath).toBe('v1');
    });
  });

  describe('getAssetTemplate', () => {
    const container = (overrides: Partial<Container> = {}) =>
      ({ name: 'dm-box', displayName: 'My Box', url: 'http://box', ...overrides }) as Container;
    const chatInterfaces = { [DeploymentInterfaceType.OpenAIChatCompletions]: {} };

    test('keeps the served MCP endpoint and maps the container transport', () => {
      expect(getAssetTemplate(ApplicationRoute.McpContainers, container(), CONTAINER_TRANSPORT.SSE)).toEqual({
        name: 'my_box',
        displayName: 'My Box',
        endpoint: 'http://box',
        transport: ENTITY_TRANSPORT[CONTAINER_TRANSPORT.SSE],
      });
    });

    test('leaves the MCP transport unset when the container reports none', () => {
      expect(getAssetTemplate(ApplicationRoute.McpContainers, container())).toHaveProperty('transport', undefined);
    });

    test('routes an adapter model through the base URL and a chat interface', () => {
      expect(getAssetTemplate(ApplicationRoute.AdapterContainers, container())).toEqual({
        name: 'my_box',
        displayName: 'My Box',
        type: DialModelResourceType.Chat,
        baseUrl: 'http://box',
        interfaces: chatInterfaces,
      });
    });

    test('routes an interceptor through the base URL and a chat interface', () => {
      expect(getAssetTemplate(ApplicationRoute.InterceptorContainers, container())).toEqual({
        name: 'my_box',
        displayName: 'My Box',
        baseUrl: 'http://box',
        interfaces: chatInterfaces,
      });
    });

    test('routes an application through the snake-case base URL and a chat interface', () => {
      expect(getAssetTemplate(ApplicationRoute.ApplicationContainers, container())).toEqual({
        name: 'my_box',
        displayName: 'My Box',
        base_url: 'http://box',
        interfaces: chatInterfaces,
      });
    });

    test('gives a text-generation serving the full OpenAI v1 endpoint and its own override name', () => {
      (getEndpointPrefix as any).mockReturnValue('openai/v1');
      (getEndpointPostfix as any).mockReturnValue('/chat/completions');

      expect(
        getAssetTemplate(ApplicationRoute.ModelServings, container({ inferenceTask: INFERENCE_TASK.TEXT_GENERATION })),
      ).toEqual({
        name: 'my_box',
        displayName: 'My Box',
        type: DialModelResourceType.Chat,
        endpoint: 'http://box/openai/v1/chat/completions',
        overrideName: 'dm-box',
      });
    });

    test('gives a text-classification serving an MCP toolset on the streamable-HTTP transport', () => {
      expect(
        getAssetTemplate(
          ApplicationRoute.ModelServings,
          container({ inferenceTask: INFERENCE_TASK.TEXT_CLASSIFICATION }),
        ),
      ).toEqual({
        name: 'my_box',
        displayName: 'My Box',
        endpoint: `http://box${SERVING_MCP_ENDPOINT_PATH}`,
        transport: ToolsetTransport.HTTP,
      });
    });

    test.each([ApplicationRoute.AdapterContainers, ApplicationRoute.InterceptorContainers])(
      'sets no roles, upstreams or override name for %s',
      (route) => {
        const template = getAssetTemplate(route, container()) as Record<string, unknown>;
        expect(template).not.toHaveProperty('userRoles');
        expect(template).not.toHaveProperty('user_roles');
        expect(template).not.toHaveProperty('upstreams');
        expect(template).not.toHaveProperty('overrideName');
      },
    );

    test.each([undefined, ''])('never emits an empty URL string when the container URL is %j', (url) => {
      const serving = getAssetTemplate(ApplicationRoute.ModelServings, container({ url })) as any;
      const adapter = getAssetTemplate(ApplicationRoute.AdapterContainers, container({ url })) as any;
      const application = getAssetTemplate(ApplicationRoute.ApplicationContainers, container({ url })) as any;
      const mcp = getAssetTemplate(ApplicationRoute.McpContainers, container({ url })) as any;

      expect(serving.endpoint).toBeUndefined();
      expect(adapter.baseUrl).toBeUndefined();
      expect(application.base_url).toBeUndefined();
      expect(mcp.endpoint).toBeUndefined();
    });
  });

  describe('getAssetView', () => {
    test.each([
      [ApplicationRoute.AdapterContainers, undefined, ApplicationRoute.PlatformModels],
      [ApplicationRoute.InterceptorContainers, undefined, ApplicationRoute.PlatformInterceptors],
      [ApplicationRoute.ApplicationContainers, undefined, ApplicationRoute.AssetsApplications],
      [ApplicationRoute.McpContainers, undefined, ApplicationRoute.AssetsToolsets],
      [ApplicationRoute.ModelServings, INFERENCE_TASK.TEXT_GENERATION, ApplicationRoute.PlatformModels],
      [ApplicationRoute.ModelServings, INFERENCE_TASK.TEXT_CLASSIFICATION, ApplicationRoute.AssetsToolsets],
    ])('maps %s (%s) to %s', (route, inferenceTask, expected) => {
      expect(getAssetView(route, { inferenceTask } as Container)).toBe(expected);
    });
  });

  describe('getTranslatedAssetOption', () => {
    test.each([
      [ApplicationRoute.AdapterContainers, EntitiesI18nKey.AssetModel],
      [ApplicationRoute.InterceptorContainers, EntitiesI18nKey.AssetInterceptor],
      [ApplicationRoute.ApplicationContainers, EntitiesI18nKey.AssetApplication],
      [ApplicationRoute.McpContainers, EntitiesI18nKey.AssetToolset],
    ])('labels the %s asset option %s', (route, expected) => {
      expect(getTranslatedAssetOption(route, {} as Container, t)).toBe(expected);
    });
  });

  describe('getTranslatedAssetEntity', () => {
    test.each([
      [ApplicationRoute.AdapterContainers, EntitiesI18nKey.Model],
      [ApplicationRoute.InterceptorContainers, EntitiesI18nKey.Interceptor],
      [ApplicationRoute.ApplicationContainers, EntitiesI18nKey.Application],
      [ApplicationRoute.McpContainers, EntitiesI18nKey.Toolset],
    ])('labels the %s Core-only create %s', (route, expected) => {
      expect(getTranslatedAssetEntity(route, {} as Container, t)).toBe(expected);
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

  describe('getDeploymentEntityKey', () => {
    const mockT = vi.fn((key: string) => `Translated: ${key}`);

    test('should return translated Container key for McpContainers route', () => {
      const result = getDeploymentEntityKey(ApplicationRoute.McpContainers, mockT);

      expect(result).toBe(`Translated: ${EntitiesI18nKey.Container}`);
      expect(mockT).toHaveBeenCalledWith(EntitiesI18nKey.Container);
    });

    test('should return translated Container key for InterceptorContainers route', () => {
      const result = getDeploymentEntityKey(ApplicationRoute.InterceptorContainers, mockT);

      expect(result).toBe(`Translated: ${EntitiesI18nKey.Container}`);
      expect(mockT).toHaveBeenCalledWith(EntitiesI18nKey.Container);
    });

    test('should return translated Serving key for ModelServings route', () => {
      const result = getDeploymentEntityKey(ApplicationRoute.ModelServings, mockT);

      expect(result).toBe(`Translated: ${EntitiesI18nKey.Serving}`);
      expect(mockT).toHaveBeenCalledWith(EntitiesI18nKey.Serving);
    });

    test('should return translated Serving key for Images route', () => {
      const result = getDeploymentEntityKey(ApplicationRoute.Images, mockT);

      expect(result).toBe(`Translated: ${ImagesI18nKey.ImageWhitelistType}`);
      expect(mockT).toHaveBeenCalledWith(ImagesI18nKey.ImageWhitelistType);
    });
  });

  describe('getCurrentPolicy', () => {
    test('should co ALL when "*" present', () => {
      expect(getCurrentPolicy({ allowedDomains: ['*'] } as Image)).toBe(WHITELIST_POLICY.ALL);
    });

    test('should co CUSTOM when "*" not present', () => {
      expect(getCurrentPolicy({ allowedDomains: ['asd.com'] } as Image)).toBe(WHITELIST_POLICY.CUSTOM);
    });
  });
});
