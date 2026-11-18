import { describe, expect, test } from 'vitest';

import { AliasPresentAs } from '@/src/models/dial/alias';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { getAliasName, toAliasPayload } from '../payload';

describe('Server :: aliases :: toAliasPayload', () => {
  test('keeps only the fields Core keeps for a stored alias', () => {
    const payload = toAliasPayload({
      name: 'assistant-v1',
      folderId: 'platform/',
      createdAt: '1',
      updatedAt: '2',
      target: { path: 'models/gpt' },
      presentAs: AliasPresentAs.Application,
      userRoles: ['default-user'],
      displayName: 'Assistant',
      description: 'General purpose',
      _metadata: {
        name: 'assistant-v1',
        path: 'platform/assistant-v1',
        folderId: 'platform/',
        status: DialModelResourceStatus.Invalid,
      },
    });

    expect(payload).toEqual({
      target: { path: 'models/gpt' },
      presentAs: AliasPresentAs.Application,
      userRoles: ['default-user'],
      displayName: 'Assistant',
      description: 'General purpose',
    });
  });

  test('omits unset fields instead of sending nulls', () => {
    expect(toAliasPayload({ target: { path: 'models/gpt' }, presentAs: undefined, intro: undefined })).toEqual({
      target: { path: 'models/gpt' },
    });
  });

  test('keeps an empty roles list, which is a deliberate value', () => {
    expect(toAliasPayload({ target: { path: 'models/gpt' }, userRoles: [] })).toHaveProperty('userRoles', []);
  });
});

describe('Server :: aliases :: getAliasName', () => {
  test('prefers the create-flow name and falls back to the merged identity', () => {
    expect(getAliasName({ name: 'a' })).toBe('a');
    expect(getAliasName({ _metadata: { name: 'b', path: 'platform/b', folderId: 'platform/' } })).toBe('b');
    expect(getAliasName({})).toBe('');
  });
});
