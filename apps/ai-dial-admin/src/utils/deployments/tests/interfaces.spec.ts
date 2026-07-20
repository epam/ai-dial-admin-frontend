import { describe, expect, test } from 'vitest';

import { stripEmptyInterfaces } from '@/src/utils/deployments/interfaces';

describe('stripEmptyInterfaces', () => {
  test('returns undefined unchanged', () => {
    expect(stripEmptyInterfaces(undefined)).toBeUndefined();
  });

  test('removes entries with a blank baseUrl', () => {
    const result = stripEmptyInterfaces({
      openaiChatCompletions: { baseUrl: '' },
      openaiResponses: { baseUrl: 'https://example.com' },
    });

    expect(result).toEqual({ openaiResponses: { baseUrl: 'https://example.com' } });
  });

  test('removes entries with a blank base_url (asset-backed casing)', () => {
    const result = stripEmptyInterfaces({
      openaiChatCompletions: { base_url: '' },
      anthropicMessages: { base_url: 'https://example.com' },
    });

    expect(result).toEqual({ anthropicMessages: { base_url: 'https://example.com' } });
  });

  test('keeps entries with a non-empty value', () => {
    const value = { openaiChatCompletions: { baseUrl: 'https://example.com' } };

    expect(stripEmptyInterfaces(value)).toEqual(value);
  });

  test('returns undefined when every entry is empty', () => {
    const result = stripEmptyInterfaces({
      openaiChatCompletions: { baseUrl: '' },
      openaiResponses: { baseUrl: '' },
    });

    expect(result).toBeUndefined();
  });

  test('returns undefined for an empty map', () => {
    expect(stripEmptyInterfaces({})).toBeUndefined();
  });
});
