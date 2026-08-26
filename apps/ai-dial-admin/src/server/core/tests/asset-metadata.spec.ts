import { describe, expect, test } from 'vitest';

import { ResourceType } from '@/src/types/resource-type';

import {
  CoreResourceMetadataNode,
  mergeApplicationResource,
  mergeConversation,
  mergeAppRunnerResource,
  mergeInterceptorResource,
  mergeModelResource,
  mergePrompt,
  mergeRoleResource,
  mergeRouteResource,
  mergeToolsetResource,
  toResourceInfoList,
} from '../asset-metadata';

const metadata = (overrides: Partial<CoreResourceMetadataNode>): CoreResourceMetadataNode => ({
  name: 'x',
  parentPath: null,
  bucket: 'bucket',
  url: 'x',
  nodeType: 'ITEM',
  ...overrides,
});

describe('Server :: Core :: asset-metadata', () => {
  test('mergeApplicationResource sources name/folderId/version/author/updatedAt from metadata, rest from content', () => {
    const content = { endpoint: 'https://app', viewerUrl: 'https://view', maxInputAttachments: 3 };
    const meta = metadata({ url: 'applications/folder/My App__2', author: 'alice', updatedAt: 111 });

    expect(mergeApplicationResource(content, meta)).toEqual({
      endpoint: 'https://app',
      viewerUrl: 'https://view',
      maxInputAttachments: 3,
      name: 'My App',
      folderId: 'folder/',
      path: 'folder/My App__2',
      version: '2',
      author: 'alice',
      updatedAt: '111',
    });
  });

  test('mergeToolsetResource sources name/folderId/version/author/updatedAt from metadata, rest from content', () => {
    const content = { endpoint: 'https://ts', maxRetryAttempts: 2 };
    const meta = metadata({ url: 'toolsets/folder/My Toolset__1', author: 'bob', updatedAt: 222 });

    expect(mergeToolsetResource(content, meta)).toEqual({
      endpoint: 'https://ts',
      maxRetryAttempts: 2,
      name: 'My Toolset',
      folderId: 'folder/',
      path: 'folder/My Toolset__1',
      version: '1',
      author: 'bob',
      updatedAt: '222',
    });
  });

  test('mergeConversation sources name/folderId/version/author/updatedAt from metadata, rest from content', () => {
    const content = { messages: [], temperature: 0.5, endpoint: 'https://conv' };
    const meta = metadata({ url: 'conversations/folder/My Conv', author: 'carol', updatedAt: 333 });

    expect(mergeConversation(content, meta)).toEqual({
      messages: [],
      temperature: 0.5,
      endpoint: 'https://conv',
      name: 'My Conv',
      folderId: 'folder/',
      path: 'folder/My Conv',
      version: '',
      author: 'carol',
      updatedAt: '333',
    });
  });

  test('mergePrompt sources name/folderId/version/author/updatedAt/nodeType from metadata, rest from content', () => {
    const content = { content: 'prompt body', description: 'desc' };
    const meta = metadata({ url: 'prompts/folder/My Prompt__1.0', author: 'dave', updatedAt: 444 });

    expect(mergePrompt(content, meta)).toEqual({
      content: 'prompt body',
      description: 'desc',
      name: 'My Prompt',
      folderId: 'folder/',
      path: 'folder/My Prompt__1.0',
      version: '1.0',
      author: 'dave',
      updatedAt: '444',
      nodeType: 'item',
    });
  });

  test('mergeModelResource sources name/folderId/path/author/updatedAt from metadata (flat, no version), rest from content', () => {
    const content = { type: 'chat', tokenizerModel: 'gpt-4', displayName: 'GPT-4' };
    const meta = metadata({ url: 'models/platform/gpt-4', author: 'eve', updatedAt: 555 });

    expect(mergeModelResource(content, meta)).toEqual({
      type: 'chat',
      tokenizerModel: 'gpt-4',
      displayName: 'GPT-4',
      name: 'gpt-4',
      folderId: '',
      path: 'gpt-4',
      author: 'eve',
      updatedAt: '555',
    });
  });

  test('mergeInterceptorResource sources name/folderId/path/author/updatedAt from metadata (flat, no version), rest from content', () => {
    const content = { displayName: 'Redactor', endpoint: 'https://interceptor' };
    const meta = metadata({ url: 'interceptors/platform/redactor', author: 'frank', updatedAt: 666 });

    expect(mergeInterceptorResource(content, meta)).toEqual({
      displayName: 'Redactor',
      endpoint: 'https://interceptor',
      name: 'redactor',
      folderId: '',
      path: 'redactor',
      author: 'frank',
      updatedAt: '666',
    });
  });

  test('mergeRouteResource sources name/folderId/path/author/updatedAt from metadata (flat, no version), rest from content', () => {
    const content = { paths: ['/api'], methods: ['GET'], order: 10 };
    const meta = metadata({ url: 'routes/platform/my-route', author: 'grace', updatedAt: 777 });

    expect(mergeRouteResource(content, meta)).toEqual({
      paths: ['/api'],
      methods: ['GET'],
      order: 10,
      name: 'my-route',
      folderId: '',
      path: 'my-route',
      author: 'grace',
      updatedAt: '777',
    });
  });

  test('mergeRoleResource sources name/folderId/path/author/updatedAt from metadata (flat, no version), rest from content', () => {
    const content = { costLimit: { minute: 10 }, share: { conversation: { invitation_ttl: 24 } } };
    const meta = metadata({ url: 'roles/platform/my-role', author: 'henry', updatedAt: 888 });

    expect(mergeRoleResource(content, meta)).toEqual({
      costLimit: { minute: 10 },
      share: { conversation: { invitation_ttl: 24 } },
      name: 'my-role',
      folderId: '',
      path: 'my-role',
      author: 'henry',
      updatedAt: '888',
    });
  });

  test('mergeRoleResource keeps costLimit/limits tokens as plain numbers and drops any that overflow a safe integer (e.g. the Long.MAX_VALUE "unlimited" sentinel), instead of keeping the lossily-rounded number a plain JSON.parse would produce', () => {
    const content = {
      costLimit: { minute: 10, day: 9223372036854775807, week: 500, month: 1000 },
      limits: { 'other-role': { minute: 9223372036854775807, day: 100 } },
    };
    const meta = metadata({ url: 'roles/platform/my-role' });

    const result = mergeRoleResource(content, meta);

    expect(result.costLimit).toEqual({ minute: 10, week: 500, month: 1000 });
    expect(result.limits).toEqual({ 'other-role': { day: 100 } });
  });

  test('toResourceInfoList maps both ITEM and FOLDER nodes, tagged with nodeType', () => {
    const node = metadata({
      nodeType: 'FOLDER',
      items: [
        metadata({ name: 'a', nodeType: 'ITEM', url: 'prompts/folder/a__1' }),
        metadata({ name: 'sub', nodeType: 'FOLDER', url: 'prompts/folder/sub/' }),
      ],
    });

    const result = toResourceInfoList(node, ResourceType.PROMPT);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: 'a', version: '1', nodeType: 'item' });
    expect(result[1]).toMatchObject({ nodeType: 'folder' });
  });

  test('toResourceInfoList returns an empty array for a node with no items', () => {
    expect(toResourceInfoList(null, ResourceType.PROMPT)).toEqual([]);
    expect(toResourceInfoList(metadata({ items: undefined }), ResourceType.PROMPT)).toEqual([]);
  });
  test('mergeAppRunnerResource decodes the resource name back into $id and flattens Core routes', () => {
    const content = {
      $schema: 'https://dial.epam.com/application_type_schemas/schema#',
      'dial:applicationTypeDisplayName': 'QQ',
      'dial:applicationTypeRoutes': {
        my_route: {
          'dial:paths': ['/a'],
          'dial:methods': ['GET'],
          'dial:upstreams': [{ 'dial:endpoint': 'http://svc' }],
        },
      },
    };
    const meta = metadata({
      url: 'schemas/platform/https%253A%252F%252Fhost%252Fqq',
      author: 'ivy',
      createdAt: 100,
      updatedAt: 200,
    });

    const result = mergeAppRunnerResource(content, meta);

    expect(result.$id).toEqual('https://host/qq');
    expect(result.name).toEqual('https%3A%2F%2Fhost%2Fqq');
    expect(result.path).toEqual('https%3A%2F%2Fhost%2Fqq');
    expect(result.folderId).toEqual('');
    expect(result.author).toEqual('ivy');
    expect(result.createdAt).toEqual('100');
    expect(result.updatedAt).toEqual('200');
    expect(result['dial:applicationTypeRoutes']).toEqual([
      { name: 'my_route', paths: ['/a'], methods: ['GET'], upstreams: [{ endpoint: 'http://svc' }] },
    ]);
  });

  test('mergeAppRunnerResource omits routes when Core returned none', () => {
    const result = mergeAppRunnerResource({ $schema: 's' }, metadata({ url: 'schemas/platform/plain' }));

    expect(result).not.toHaveProperty('dial:applicationTypeRoutes');
    expect(result.$id).toEqual('plain');
  });

  test('flat merges project createdAt from metadata', () => {
    const result = mergeModelResource({}, metadata({ url: 'models/platform/gpt-4', createdAt: 42 }));

    expect(result.createdAt).toEqual('42');
  });

  test('toResourceInfoList decodes an app runner row name to its $id while leaving path encoded', () => {
    const node = metadata({
      nodeType: 'FOLDER',
      items: [metadata({ nodeType: 'ITEM', url: 'schemas/platform/https%253A%252F%252Fhost%252Fqq', createdAt: 7 })],
    });

    const result = toResourceInfoList(node, ResourceType.APP_TYPE_SCHEMA);

    expect(result[0]).toMatchObject({
      name: 'https://host/qq',
      path: 'https%3A%2F%2Fhost%2Fqq',
      createdAt: '7',
    });
  });
});
