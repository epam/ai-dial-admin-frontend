import { describe, expect, test } from 'vitest';

import { ResourceType } from '@/src/types/resource-type';

import {
  CoreResourceMetadataNode,
  mergeApplicationResource,
  mergeConversation,
  mergeAppRunnerResource,
  mergeCatalogSchemaResource,
  mergeInterceptorResource,
  mergeKeyResource,
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
  test('mergeApplicationResource grafts name/folderId/version/author/updatedAt under _metadata, rest from content', () => {
    const content = { endpoint: 'https://app', viewerUrl: 'https://view', maxInputAttachments: 3 };
    const meta = metadata({ url: 'applications/folder/My App__2', author: 'alice', updatedAt: 111 });

    expect(mergeApplicationResource(content, meta)).toEqual({
      endpoint: 'https://app',
      viewerUrl: 'https://view',
      maxInputAttachments: 3,
      // Public-bucket `name` is a flat pass-through here: `content` carries no `name` of its own, so
      // this only shows the field is always present, not that it overrides anything (see the
      // dual-bucket override test below for the actual exception to D3).
      name: 'My App',
      _metadata: {
        name: 'My App',
        folderId: 'folder/',
        path: 'folder/My App__2',
        version: '2',
        author: 'alice',
        updatedAt: '111',
      },
    });
  });

  test('mergeApplicationResource grafts a platform-bucket resource with bucket-qualified path and folderId under _metadata', () => {
    const content = { endpoint: 'https://app' };
    const meta = metadata({ url: 'applications/platform/my-app', author: 'alice', createdAt: 100, updatedAt: 111 });

    expect(mergeApplicationResource(content, meta)).toEqual({
      endpoint: 'https://app',
      name: 'my-app',
      _metadata: {
        name: 'my-app',
        path: 'platform/my-app',
        folderId: 'platform/',
        author: 'alice',
        createdAt: '100',
        updatedAt: '111',
      },
    });
  });

  // D3 amendment (design.md): dual-bucket applications/toolsets are the one documented exception to
  // "grafts never overwrite content" — the URL-parsed identity from `dualBucketMetadataFields` is
  // authoritative over whatever `content.name` happens to hold, because a platform-bucket resource's
  // served `name` can go stale relative to its Core resource path (see platform-applications spec).
  test('mergeApplicationResource overrides a divergent content.name with the dual-bucket corrected identity (documented exception to D3)', () => {
    const content = { endpoint: 'https://app', name: 'Stale Name' };
    const meta = metadata({ url: 'applications/platform/my-app', author: 'alice', updatedAt: 111 });

    const result = mergeApplicationResource(content, meta);

    expect(result.name).toEqual('my-app');
    expect(result._metadata?.name).toEqual('my-app');
  });

  test('mergeApplicationResource keeps inline content audit fields flat and prefers the metadata node over them inside _metadata', () => {
    const content = { endpoint: 'https://app', author: 'content-author', created_at: 1, updated_at: 2 };
    const meta = metadata({ url: 'applications/folder/My App__2', createdAt: 42, updatedAt: 52 });

    const result = mergeApplicationResource(content, meta);

    // The content object is never mutated by the merge — its own fields survive flat.
    expect(result.author).toBe('content-author');
    expect(result.created_at).toBe(1);
    expect(result.updated_at).toBe(2);
    // `_metadata` sources metadata-first; the metadata node's timestamps win over the content's.
    expect(result._metadata).toMatchObject({
      name: 'My App',
      folderId: 'folder/',
      path: 'folder/My App__2',
      version: '2',
      author: 'content-author',
      createdAt: '42',
      updatedAt: '52',
    });
  });

  test("mergeApplicationResource falls back to the content response's inline timestamps when the metadata node omits them", () => {
    const content = { endpoint: 'https://app', created_at: 1, updated_at: 2 };
    const meta = metadata({ url: 'applications/folder/My App__2' });

    const result = mergeApplicationResource(content, meta);

    expect(result._metadata?.createdAt).toEqual('1');
    expect(result._metadata?.updatedAt).toEqual('2');
  });

  test('mergeToolsetResource grafts name/folderId/version/author/updatedAt under _metadata, rest from content', () => {
    const content = { endpoint: 'https://ts', maxRetryAttempts: 2 };
    const meta = metadata({ url: 'toolsets/folder/My Toolset__1', author: 'bob', updatedAt: 222 });

    expect(mergeToolsetResource(content, meta)).toEqual({
      endpoint: 'https://ts',
      maxRetryAttempts: 2,
      name: 'My Toolset',
      _metadata: {
        name: 'My Toolset',
        folderId: 'folder/',
        path: 'folder/My Toolset__1',
        version: '1',
        author: 'bob',
        updatedAt: '222',
      },
    });
  });

  test('mergeToolsetResource grafts a platform-bucket resource with bucket-qualified path and folderId under _metadata', () => {
    const content = { endpoint: 'https://ts' };
    const meta = metadata({ url: 'toolsets/platform/my-toolset', author: 'bob', createdAt: 200, updatedAt: 222 });

    expect(mergeToolsetResource(content, meta)).toEqual({
      endpoint: 'https://ts',
      name: 'my-toolset',
      _metadata: {
        name: 'my-toolset',
        path: 'platform/my-toolset',
        folderId: 'platform/',
        author: 'bob',
        createdAt: '200',
        updatedAt: '222',
      },
    });
  });

  // See the analogous mergeApplicationResource test above for why this overrides content.name.
  test('mergeToolsetResource overrides a divergent content.name with the dual-bucket corrected identity (documented exception to D3)', () => {
    const content = { endpoint: 'https://ts', name: 'Stale Name' };
    const meta = metadata({ url: 'toolsets/platform/my-toolset', author: 'bob', updatedAt: 222 });

    const result = mergeToolsetResource(content, meta);

    expect(result.name).toEqual('my-toolset');
    expect(result._metadata?.name).toEqual('my-toolset');
  });

  test('mergeConversation grafts name/folderId/author/updatedAt under _metadata, rest from content', () => {
    const content = { messages: [], temperature: 0.5, endpoint: 'https://conv' };
    const meta = metadata({ url: 'conversations/folder/My Conv', author: 'carol', updatedAt: 333 });

    expect(mergeConversation(content, meta)).toEqual({
      messages: [],
      temperature: 0.5,
      endpoint: 'https://conv',
      _metadata: {
        name: 'My Conv',
        folderId: 'folder/',
        path: 'folder/My Conv',
        author: 'carol',
        updatedAt: '333',
      },
    });
  });

  test('mergePrompt grafts name/folderId/author/updatedAt/nodeType under _metadata, rest from content — a `__` in the name stays part of the name', () => {
    const content = { content: 'prompt body', description: 'desc' };
    const meta = metadata({ url: 'prompts/folder/My Prompt__1.0', author: 'dave', updatedAt: 444 });

    expect(mergePrompt(content, meta)).toEqual({
      content: 'prompt body',
      description: 'desc',
      // `DialFile.path` is required and prompt content never carries `path`/`folderId` of its own —
      // these fill a type-required gap, not an overwrite of a served content field (contrast the
      // dual-bucket application/toolset `name` exception above, where content.name is overridden).
      path: 'folder/My Prompt__1.0',
      folderId: 'folder/',
      _metadata: {
        name: 'My Prompt__1.0',
        folderId: 'folder/',
        path: 'folder/My Prompt__1.0',
        author: 'dave',
        updatedAt: '444',
        nodeType: 'item',
      },
    });
  });

  test('mergeModelResource grafts name/path/folderId/author/updatedAt under _metadata (flat, no version), rest from content', () => {
    const content = { type: 'chat', tokenizerModel: 'gpt-4', displayName: 'GPT-4' };
    const meta = metadata({ url: 'models/platform/gpt-4', author: 'eve', updatedAt: 555 });

    expect(mergeModelResource(content, meta)).toEqual({
      type: 'chat',
      tokenizerModel: 'gpt-4',
      displayName: 'GPT-4',
      _metadata: {
        name: 'gpt-4',
        path: 'gpt-4',
        folderId: '',
        author: 'eve',
        updatedAt: '555',
      },
    });
  });

  test('mergeInterceptorResource grafts name/path/folderId/author/updatedAt under _metadata (flat, no version), rest from content', () => {
    const content = { displayName: 'Redactor', endpoint: 'https://interceptor' };
    const meta = metadata({ url: 'interceptors/platform/redactor', author: 'frank', updatedAt: 666 });

    expect(mergeInterceptorResource(content, meta)).toEqual({
      displayName: 'Redactor',
      endpoint: 'https://interceptor',
      _metadata: {
        name: 'redactor',
        path: 'redactor',
        folderId: '',
        author: 'frank',
        updatedAt: '666',
      },
    });
  });

  test('mergeRouteResource grafts name/path/folderId/author/updatedAt under _metadata (flat, no version), rest from content', () => {
    const content = { paths: ['/api'], methods: ['GET'], order: 10 };
    const meta = metadata({ url: 'routes/platform/my-route', author: 'grace', updatedAt: 777 });

    expect(mergeRouteResource(content, meta)).toEqual({
      paths: ['/api'],
      methods: ['GET'],
      order: 10,
      _metadata: {
        name: 'my-route',
        path: 'my-route',
        folderId: '',
        author: 'grace',
        updatedAt: '777',
      },
    });
  });

  test('mergeRoleResource grafts name/path/folderId/author/updatedAt under _metadata (flat, no version), rest from content', () => {
    const content = { costLimit: { minute: 10 }, share: { conversation: { invitation_ttl: 24 } } };
    const meta = metadata({ url: 'roles/platform/my-role', author: 'henry', updatedAt: 888 });

    expect(mergeRoleResource(content, meta)).toEqual({
      costLimit: { minute: 10 },
      share: { conversation: { invitation_ttl: 24 } },
      _metadata: {
        name: 'my-role',
        path: 'my-role',
        folderId: '',
        author: 'henry',
        updatedAt: '888',
      },
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
    // Prompts are versionless: the `__1` in the url's last segment is the name verbatim, and no
    // `version` is grafted onto the row.
    expect(result[0]).toMatchObject({ name: 'a__1', nodeType: 'item', bucket: 'bucket' });
    expect(result[0].version).toBeUndefined();
    expect(result[1]).toMatchObject({ nodeType: 'folder', bucket: 'bucket' });
    // Rows are the metadata-only grid projection — they stay flat, never carrying `_metadata`.
    expect(result[0]).not.toHaveProperty('_metadata');
    expect(result[1]).not.toHaveProperty('_metadata');
  });

  test('toResourceInfoList returns an empty array for a node with no items', () => {
    expect(toResourceInfoList(null, ResourceType.PROMPT)).toEqual([]);
    expect(toResourceInfoList(metadata({ items: undefined }), ResourceType.PROMPT)).toEqual([]);
  });

  test("toResourceInfoList carries each item's own bucket value through untouched, public and platform alike", () => {
    const node = metadata({
      nodeType: 'FOLDER',
      items: [
        metadata({ name: 'a', nodeType: 'ITEM', url: 'prompts/folder/a__1', bucket: 'public' }),
        metadata({ name: 'b', nodeType: 'ITEM', url: 'prompts/folder/b__1', bucket: 'platform' }),
      ],
    });

    const result = toResourceInfoList(node, ResourceType.PROMPT);

    expect(result[0].bucket).toBe('public');
    expect(result[1].bucket).toBe('platform');
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
    expect(result._metadata?.name).toEqual('https%3A%2F%2Fhost%2Fqq');
    expect(result._metadata?.path).toEqual('https%3A%2F%2Fhost%2Fqq');
    expect(result._metadata?.folderId).toEqual('');
    expect(result._metadata?.author).toEqual('ivy');
    expect(result._metadata?.createdAt).toEqual('100');
    expect(result._metadata?.updatedAt).toEqual('200');
    expect(result['dial:applicationTypeRoutes']).toEqual([
      { name: 'my_route', paths: ['/a'], methods: ['GET'], upstreams: [{ endpoint: 'http://svc' }] },
    ]);
  });

  test('mergeAppRunnerResource omits routes when Core returned none', () => {
    const result = mergeAppRunnerResource({ $schema: 's' }, metadata({ url: 'schemas/platform/plain' }));

    expect(result).not.toHaveProperty('dial:applicationTypeRoutes');
    expect(result.$id).toEqual('plain');
  });

  test('mergeCatalogSchemaResource decodes the resource name back into $id and passes the body through', () => {
    const content = {
      $schema: 'https://dial.epam.com/catalog_schemas/schema#',
      'dial:catalogEntityType': 'agent',
      'dial:catalogDisplayName': 'Agent',
      properties: { summary: { type: 'string', 'dial:meta': { 'dial:tab': 'About' } } },
    };
    const meta = metadata({
      url: 'catalog_schemas/platform/https%253A%252F%252Fhost%252Fagent',
      author: 'ivy',
      createdAt: 100,
      updatedAt: 200,
    });

    const result = mergeCatalogSchemaResource(content, meta);

    expect(result.$id).toEqual('https://host/agent');
    expect(result._metadata?.name).toEqual('https%3A%2F%2Fhost%2Fagent');
    expect(result._metadata?.path).toEqual('https%3A%2F%2Fhost%2Fagent');
    expect(result._metadata?.folderId).toEqual('');
    expect(result._metadata?.author).toEqual('ivy');
    expect(result._metadata?.createdAt).toEqual('100');
    expect(result._metadata?.updatedAt).toEqual('200');
    expect(result['dial:catalogEntityType']).toEqual('agent');
    expect(result.properties).toEqual(content.properties);
  });

  test('mergeCatalogSchemaResource leaves a plain name as its own $id', () => {
    const result = mergeCatalogSchemaResource({ $schema: 's' }, metadata({ url: 'catalog_schemas/platform/plain' }));

    expect(result.$id).toEqual('plain');
  });

  test('mergeCatalogSchemaResource keeps the $id a schema stored under another name declares', () => {
    const result = mergeCatalogSchemaResource(
      { $id: 'https://host/agent' },
      metadata({ url: 'catalog_schemas/platform/legacy-name' }),
    );

    expect(result.$id).toEqual('https://host/agent');
    expect(result._metadata?.name).toEqual('legacy-name');
  });

  test.each([
    ['a blank $id', '   '],
    ['an empty $id', ''],
    ['a non-string $id', 7],
  ])('mergeCatalogSchemaResource falls back to the decoded name for %s', (_label, declared) => {
    const result = mergeCatalogSchemaResource(
      { $id: declared },
      metadata({ url: 'catalog_schemas/platform/https%253A%252F%252Fhost%252Fagent' }),
    );

    expect(result.$id).toEqual('https://host/agent');
  });

  test('mergeAppRunnerResource still overwrites the body $id with the decoded name', () => {
    const result = mergeAppRunnerResource(
      { $id: 'https://host/other' },
      metadata({ url: 'schemas/platform/https%253A%252F%252Fhost%252Frunner' }),
    );

    expect(result.$id).toEqual('https://host/runner');
  });

  test('toResourceInfoList decodes a catalog schema row name to its $id while leaving path encoded', () => {
    const node = metadata({
      nodeType: 'FOLDER',
      items: [metadata({ nodeType: 'ITEM', url: 'catalog_schemas/platform/https%253A%252F%252Fhost%252Fagent' })],
    });

    const result = toResourceInfoList(node, ResourceType.CATALOG_SCHEMA);

    expect(result[0].name).toEqual('https://host/agent');
    expect(result[0].path).toEqual('https%3A%2F%2Fhost%2Fagent');
  });

  test('flat merges project createdAt from metadata into _metadata', () => {
    const result = mergeModelResource({}, metadata({ url: 'models/platform/gpt-4', createdAt: 42 }));

    expect(result._metadata?.createdAt).toEqual('42');
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

  test('mergeKeyResource grafts name/path/folderId/author under _metadata (flat, no version), rest from content', () => {
    const content = { project: 'proj', secured: true, roles: ['r1'] };
    const meta = metadata({ url: 'keys/platform/my-key', author: 'someone', createdAt: 9, updatedAt: 11 });

    expect(mergeKeyResource(content, meta)).toEqual({
      project: 'proj',
      secured: true,
      roles: ['r1'],
      _metadata: {
        name: 'my-key',
        path: 'my-key',
        folderId: '',
        author: 'someone',
        createdAt: '9',
        updatedAt: '11',
      },
    });
  });

  test('mergeKeyResource treats a null allowedIpAddressRanges as absent (ALLOW_ALL)', () => {
    const content = { project: 'proj', allowedIpAddressRanges: null };
    const meta = metadata({ url: 'keys/platform/k' });

    expect(mergeKeyResource(content, meta)).not.toHaveProperty('allowedIpAddressRanges');
  });

  test('mergeKeyResource preserves an empty-ranges bean as an empty array (BLOCK_ALL survives a reload)', () => {
    const content = { project: 'proj', allowedIpAddressRanges: { ranges: [] } };
    const meta = metadata({ url: 'keys/platform/k' });

    expect(mergeKeyResource(content, meta)).toHaveProperty('allowedIpAddressRanges', []);
  });

  test('mergeKeyResource reconstructs CIDR strings from a populated-ranges bean (base64 mask/maskedBaseIp)', () => {
    // 192.168.1.0/24 — mask 255.255.255.0 = [0xff,0xff,0xff,0x00], maskedBaseIp 192.168.1.0 = [0xc0,0xa8,0x01,0x00]
    const mask = Buffer.from([0xff, 0xff, 0xff, 0x00]).toString('base64');
    const maskedBaseIp = Buffer.from([0xc0, 0xa8, 0x01, 0x00]).toString('base64');
    const content = { project: 'proj', allowedIpAddressRanges: { ranges: [{ mask, maskedBaseIp }] } };
    const meta = metadata({ url: 'keys/platform/k' });

    expect(mergeKeyResource(content, meta)).toHaveProperty('allowedIpAddressRanges', ['192.168.1.0/24']);
  });

  test('mergeKeyResource drops a range whose mask and IP byte lengths do not match', () => {
    // 3-byte mask vs 4-byte IP — cidrFromRange returns undefined, and with no valid ranges left the
    // property is absent (a key with only undecodable ranges reads back as allow-all).
    const mask = Buffer.from([0xff, 0xff, 0xff]).toString('base64');
    const maskedBaseIp = Buffer.from([0xc0, 0xa8, 0x01, 0x00]).toString('base64');
    const content = { project: 'proj', allowedIpAddressRanges: { ranges: [{ mask, maskedBaseIp }] } };
    const meta = metadata({ url: 'keys/platform/k' });

    expect(mergeKeyResource(content, meta)).not.toHaveProperty('allowedIpAddressRanges');
  });

  test('mergeKeyResource keeps a real string[] allowedIpAddressRanges as-is', () => {
    const content = { project: 'proj', allowedIpAddressRanges: ['192.168.0.0/24'] };
    const meta = metadata({ url: 'keys/platform/k' });

    expect(mergeKeyResource(content, meta)).toHaveProperty('allowedIpAddressRanges', ['192.168.0.0/24']);
  });
});
