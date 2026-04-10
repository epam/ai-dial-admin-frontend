import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import { prepareEntityForDuplicate, getCorrectPath, preparePathForAsset } from '../utils';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

vi.mock('@/src/app/[lang]/applications/actions', () => ({
  getApplication: vi.fn(() =>
    Promise.resolve({
      response: {
        name: 'test-app',
        description: 'Test Application',
      },
    }),
  ),
}));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getApp: vi.fn(() =>
    Promise.resolve({
      response: {
        name: 'test-asset-app',
        description: 'Test Asset App',
        folderId: 'folder',
        reference: 'some-ref-to-delete',
      },
    }),
  ),
}));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  getToolset: vi.fn((folderId, name, version) => {
    if (name === 'toolset1') {
      return Promise.resolve({
        response: {
          name: 'toolset1',
          displayName: 'Toolset One',
          folderId: 'folder',
          authSettings: {
            authenticationType: 'oauth',
            authorizationEndpoint: 'https://auth.example.com',
            clientId: 'client-123',
            clientSecret: 'secret-123',
            apiKeyHeader: undefined,
            globalAuthStatus: 'signed_in',
            userLevelAuthStatus: 'signed_in',
          },
        },
      });
    } else if (name === 'toolset2') {
      return Promise.resolve({
        response: {
          name: 'toolset2',
          displayName: 'Toolset Two',
          folderId: 'folder',
          authSettings: {
            authenticationType: 'api_key',
            apiKeyHeader: 'X-API-Key',
            globalAuthStatus: 'signed_in',
            userLevelAuthStatus: 'signed_in',
          },
        },
      });
    } else if (name === 'toolset4') {
      return Promise.resolve({
        response: {
          name: 'toolset4',
          displayName: 'Toolset Four',
          folderId: 'folder',
        },
      });
    }
    return Promise.resolve({
      response: {
        name,
        displayName: 'Default Toolset',
        folderId,
      },
    });
  }),
}));

vi.mock('@/src/app/[lang]/prompts/actions', () => ({
  getPrompt: vi.fn(() =>
    Promise.resolve({
      response: {
        name: 'test-prompt',
        description: 'Test Prompt Description',
        content: 'Test prompt content',
      },
    }),
  ),
}));

describe('Utils :: prepareEntityForDuplicate', () => {
  const entity = {
    name: 'n',
    description: 'd',
    version: 'v',
    entities: ['entities'],
    roles: ['roles'],
  };

  test('Should return filtered role', async () => {
    const result = await prepareEntityForDuplicate(
      ApplicationRoute.Roles,
      {
        name: 'n',
        description: 'd',
        grantedKeys: ['key'],
        share: { a: {} },
        limits: { a: {} },
      },
      {} as any,
    );
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      grantedKeys: [],
      limits: {},
      share: {},
    });
  });

  test('Should return filtered interceptor', async () => {
    const result = await prepareEntityForDuplicate(ApplicationRoute.Interceptors, entity, {} as any);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: [],
      roles: ['roles'],
      applicationTypeSchemas: [],
    });
  });

  test('Should return filtered keys', async () => {
    const result = await prepareEntityForDuplicate(ApplicationRoute.Keys, entity, {} as any);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: ['entities'],
      roles: [],
    });
  });

  test('Should return original entity', async () => {
    const result = await prepareEntityForDuplicate(ApplicationRoute.Models, entity, {} as any);
    expect(result).toEqual(entity);
  });

  test('Should sanitize OAuth auth settings for AssetsToolsets', async () => {
    const toolsetWithOAuth = {
      name: 'toolset1',
      displayName: 'Toolset One',
      folderId: 'folder',
      authSettings: {
        authenticationType: 'oauth',
        clientId: 'client-123',
        clientSecret: 'secret-456',
        authorizationEndpoint: 'https://auth.example.com',
        globalAuthStatus: 'signed_in',
        userLevelAuthStatus: 'signed_out',
        apiKeyHeader: 'X-API-Key',
      },
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.AssetsToolsets, toolsetWithOAuth, {
      current: {
        folderId: 'folder',
        name: 'toolset1',
        version: '1.0.0',
      },
    } as any);

    expect(result).toEqual({
      name: 'toolset1',
      displayName: 'Toolset One',
      folderId: 'folder',
      authSettings: {
        authenticationType: 'oauth',
        clientId: 'client-123',
        clientSecret: undefined,
        authorizationEndpoint: 'https://auth.example.com',
        globalAuthStatus: undefined,
        userLevelAuthStatus: undefined,
        apiKeyHeader: undefined,
      },
    });
  });

  test('Should sanitize API_KEY auth settings for AssetsToolsets', async () => {
    const toolsetWithApiKey = {
      name: 'toolset2',
      displayName: 'Toolset Two',
      folderId: 'folder',
      authSettings: {
        authenticationType: 'api_key',
        apiKeyHeader: 'X-API-Key',
        globalAuthStatus: 'signed_in',
        userLevelAuthStatus: 'signed_in',
      },
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.AssetsToolsets, toolsetWithApiKey, {
      current: {
        folderId: 'folder',
        name: 'toolset2',
        version: '1.0.0',
      },
    } as any);

    expect(result).toEqual({
      name: 'toolset2',
      displayName: 'Toolset Two',
      folderId: 'folder',
      authSettings: {
        authenticationType: 'api_key',
        apiKeyHeader: 'X-API-Key',
        globalAuthStatus: undefined,
        userLevelAuthStatus: undefined,
        clientSecret: undefined,
      },
    });
  });

  test('Should sanitize auth settings for Toolsets route', async () => {
    const toolsetWithOAuth = {
      name: 'toolset3',
      displayName: 'Toolset Three',
      authSettings: {
        authenticationType: 'oauth',
        clientId: 'client-789',
        clientSecret: 'secret-abc',
        authorizationEndpoint: 'https://auth2.example.com',
        globalAuthStatus: 'signed_in',
        userLevelAuthStatus: 'signed_in',
      },
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.Toolsets, toolsetWithOAuth, {
      current: {
        name: 'toolset3',
      },
    } as any);

    expect(result).toEqual({
      name: 'toolset3',
      displayName: 'Toolset Three',
      authSettings: {
        authenticationType: 'oauth',
        clientId: 'client-789',
        clientSecret: undefined,
        authorizationEndpoint: 'https://auth2.example.com',
        globalAuthStatus: undefined,
        userLevelAuthStatus: undefined,
        apiKeyHeader: undefined,
      },
    });
  });

  test('Should handle toolset without auth settings', async () => {
    const toolsetWithoutAuth = {
      name: 'toolset4',
      displayName: 'Toolset Four',
      folderId: 'folder',
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.AssetsToolsets, toolsetWithoutAuth, {
      current: {
        folderId: 'folder',
        name: 'toolset4',
        version: '1.0.0',
      },
    } as any);

    expect(result).toEqual({
      name: 'toolset4',
      displayName: 'Toolset Four',
      folderId: 'folder',
      authSettings: undefined,
    });
  });

  test('Should return filtered adapter', async () => {
    const result1 = await prepareEntityForDuplicate(
      ApplicationRoute.Adapters,
      { ...entity, models: ['folder'] } as DialAdapter,
      {
        current: {
          folderId: 'aaa',
          name: 'adapter',
          version: '1.0.0',
        },
      } as any,
    );
    expect(result1).toEqual({
      ...entity,
      description: 'd',
      models: [],
    });
  });

  test('Should return filtered app runner', async () => {
    const result1 = await prepareEntityForDuplicate(
      ApplicationRoute.ApplicationRunners,
      { ...entity, applications: ['folder'] } as DialApplicationScheme,
      {
        current: {
          name: 'app runner',
        },
      } as any,
    );
    expect(result1).toEqual({
      ...entity,
      description: 'd',
      applications: [],
    });
  });

  test('Should return filtered interceptor template', async () => {
    const result1 = await prepareEntityForDuplicate(
      ApplicationRoute.InterceptorTemplates,
      { ...entity, interceptors: ['folder'] } as InterceptorTemplate,
      {
        current: {
          name: 'interceptor',
        },
      } as any,
    );
    expect(result1).toEqual({
      ...entity,
      description: 'd',
      interceptors: [],
    });
  });

  test('Should sanitize API_KEY auth settings for Toolsets route', async () => {
    const toolsetWithApiKey = {
      name: 'toolset-api-key',
      displayName: 'Toolset API Key',
      authSettings: {
        authenticationType: 'api_key',
        apiKeyHeader: 'X-Custom-Key',
        globalAuthStatus: 'signed_in',
        userLevelAuthStatus: 'signed_in',
      },
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.Toolsets, toolsetWithApiKey, {
      current: {
        name: 'toolset-api-key',
      },
    } as any);

    expect(result).toEqual({
      name: 'toolset-api-key',
      displayName: 'Toolset API Key',
      authSettings: {
        authenticationType: 'api_key',
        apiKeyHeader: 'X-Custom-Key',
        globalAuthStatus: undefined,
        userLevelAuthStatus: undefined,
        clientSecret: undefined,
      },
    });
  });

  test('Should return application data for Applications route', async () => {
    const app = {
      name: 'test-app',
      description: 'Test Application',
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.Applications, app, {
      current: {
        name: 'test-app',
      },
    } as any);

    expect(result).toEqual({
      name: 'test-app',
      description: 'Test Application',
    });
  });

  test('Should extract prompt data for Prompts route', async () => {
    const prompt = {
      name: 'test-prompt',
      folderId: 'folder',
      version: '1.0.0',
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.Prompts, prompt, {
      current: {
        name: 'test-prompt',
        folderId: 'folder',
        version: '1.0.0',
      },
    } as any);

    expect(result).toEqual({
      name: 'test-prompt',
      folderId: 'folder',
      version: '1.0.0',
      description: 'Test Prompt Description',
      content: 'Test prompt content',
    });
  });

  test('Should merge asset app data for AssetsApplications route', async () => {
    const assetApp = {
      name: 'test-asset-app',
      folderId: 'folder',
      version: '1.0.0',
      description: 'Original Description',
    };

    const result = await prepareEntityForDuplicate(ApplicationRoute.AssetsApplications, assetApp, {
      current: {
        name: 'test-asset-app',
        folderId: 'folder',
        version: '1.0.0',
      },
    } as any);

    expect(result).toEqual({
      name: 'test-asset-app',
      folderId: 'folder',
      version: '1.0.0',
      description: 'Original Description',
    });
  });
});

describe('Utils :: getCorrectPath', () => {
  test('Should return formatted path with folderId, name, and version', () => {
    const entity = {
      folderId: 'my-folder',
      name: 'my-entity',
      version: '1.0.0',
    };

    const result = getCorrectPath(entity);

    expect(result).toBe('my-foldermy-entity__1.0.0');
  });

  test('Should handle undefined entity', () => {
    const result = getCorrectPath(undefined);

    expect(result).toBe('undefinedundefined__undefined');
  });

  test('Should handle null entity', () => {
    const result = getCorrectPath(null);

    expect(result).toBe('undefinedundefined__undefined');
  });
});

describe('Utils :: preparePathForAsset', () => {
  test('Should add path property for asset routes', () => {
    const entity = {
      name: 'test-asset',
      folderId: 'folder',
      version: '1.0.0',
    };

    const result = preparePathForAsset(entity, ApplicationRoute.AssetsApplications);

    expect(result).toEqual({
      name: 'test-asset',
      folderId: 'folder',
      version: '1.0.0',
      path: 'foldertest-asset__1.0.0',
    });
  });

  test('Should return entity unchanged for non-asset routes', () => {
    const entity = {
      name: 'test-role',
      description: 'Test Role',
    };

    const result = preparePathForAsset(entity, ApplicationRoute.Roles);

    expect(result).toEqual({
      name: 'test-role',
      description: 'Test Role',
    });
  });
});
