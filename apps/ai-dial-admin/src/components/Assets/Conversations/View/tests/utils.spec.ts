import { describe, expect, test } from 'vitest';

import { DialConversation } from '@/src/models/dial/conversation';
import { getConversationPathWithVersion, getConversationVersions } from '../utils';

describe('Conversations View utils', () => {
  const baseConversation: DialConversation = {
    descriptionKeywords: [],
    path: 'public/conversations/hello__1.0.0',
    folderId: 'folder-id',
    author: 'author',
    endpoint: '',
    iconUrl: '',
    temperature: 0,
    messages: [],
  };

  test('getConversationPathWithVersion updates only the version segment', () => {
    const result = getConversationPathWithVersion(baseConversation, '1.0.1');

    expect(result).toBe('public/conversations/hello__1.0.1');
  });

  test('getConversationPathWithVersion preserves names that contain __', () => {
    const conversationWithUnderscores: DialConversation = {
      ...baseConversation,
      path: 'public/conversations/title__with__underscores__1.0.0',
    };

    const result = getConversationPathWithVersion(conversationWithUnderscores, '2.0.0');

    expect(result).toBe('public/conversations/title__with__underscores__2.0.0');
  });

  test('getConversationVersions returns versions only for the same conversation name', () => {
    const conversations: DialConversation[] = [
      baseConversation,
      {
        ...baseConversation,
        path: 'public/conversations/hello__1.1.0',
      },
      {
        ...baseConversation,
        path: 'public/conversations/other__1.0.0',
      },
    ];

    const result = getConversationVersions(baseConversation, conversations);

    expect(result).toEqual(['1.0.0', '1.1.0']);
  });

  test('getConversationVersions returns an empty array when no conversations are provided', () => {
    const result = getConversationVersions(baseConversation, null);

    expect(result).toEqual([]);
  });
});
