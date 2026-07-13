import { describe, expect, test } from 'vitest';

import {
  CoreResourceMetadataNode,
  mergeApplicationResource,
  mergeConversation,
  mergePrompt,
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

  test('toResourceInfoList maps both ITEM and FOLDER nodes, tagged with nodeType', () => {
    const node = metadata({
      nodeType: 'FOLDER',
      items: [
        metadata({ name: 'a', nodeType: 'ITEM', url: 'prompts/folder/a__1' }),
        metadata({ name: 'sub', nodeType: 'FOLDER', url: 'prompts/folder/sub/' }),
      ],
    });

    const result = toResourceInfoList(node, 'prompts/');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: 'a', version: '1', nodeType: 'item' });
    expect(result[1]).toMatchObject({ nodeType: 'folder' });
  });

  test('toResourceInfoList returns an empty array for a node with no items', () => {
    expect(toResourceInfoList(null, 'prompts/')).toEqual([]);
    expect(toResourceInfoList(metadata({ items: undefined }), 'prompts/')).toEqual([]);
  });
});
