import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { prepareEntityForDuplicate } from '../utils';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

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

  test('Should return original entity for Prompts', async () => {
    const result1 = await prepareEntityForDuplicate(ApplicationRoute.Prompts, { ...entity, folderId: 'folder' }, {
      current: {
        folderId: 'aaa',
        name: 'prompt',
        version: '1.0.0',
      },
    } as any);
    expect(result1).toEqual({
      ...entity,
      description: void 0,
      content: void 0,
      folderId: 'folder',
    });
  });

  test('Should return original entity for Apps', async () => {
    const result1 = await prepareEntityForDuplicate(
      ApplicationRoute.AssetsApplications,
      { ...entity, folderId: 'folder' },
      {
        current: {
          folderId: 'aaa',
          name: 'app',
          version: '1.0.0',
        },
      } as any,
    );
    expect(result1).toEqual({
      ...entity,
      description: 'd',
      folderId: 'folder',
    });
  });

  test('Should return original entity for Toolsets', async () => {
    const result1 = await prepareEntityForDuplicate(
      ApplicationRoute.AssetsToolsets,
      { ...entity, folderId: 'folder' },
      {
        current: {
          folderId: 'aaa',
          name: 'toolset',
          version: '1.0.0',
        },
      } as any,
    );
    expect(result1).toEqual({
      ...entity,
      description: 'd',
      folderId: 'folder',
      authSettings: undefined,
    });
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
        clientSecret: '',
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
        clientSecret: '',
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
        clientSecret: '',
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

  test('Should return filtered interceptor', async () => {
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
});
