import { ToolsetAuthType } from '@/src/models/dial/toolset';
import { describe, expect, test } from 'vitest';
import { encodeToolsetRedirectState, getToolsetBasicBody, getToolsetSignInBody } from '../toolset-auth';

describe('toolset-auth utils', () => {
  test('getToolsetSignInBody returns OAUTH body with code', () => {
    const toolset = { authSettings: { authenticationType: ToolsetAuthType.OAUTH } } as any;
    const result = getToolsetSignInBody(toolset, 'admin', 'authcode');
    expect(result).toMatchObject({
      credentials_level: 'admin',
      authenticationType: ToolsetAuthType.OAUTH,
      code: 'authcode',
    });
  });

  test('getToolsetSignInBody returns APIKEY body with apiKeyHeader', () => {
    const toolset = { authSettings: { authenticationType: ToolsetAuthType.API_KEY, apiKeyHeader: 'X-API-KEY' } } as any;
    const result = getToolsetSignInBody(toolset, 'user');
    expect(result).toMatchObject({
      credentials_level: 'user',
      authenticationType: ToolsetAuthType.API_KEY,
      apiKeyHeader: 'X-API-KEY',
    });
  });

  test('getToolsetBasicBody returns basic body', () => {
    const toolset = { authSettings: { authenticationType: ToolsetAuthType.API_KEY } } as any;
    const result = getToolsetBasicBody(toolset, 'user');
    expect(result).toMatchObject({ credentials_level: 'user', authenticationType: ToolsetAuthType.API_KEY });
  });

  test('encodeToolsetRedirectState encodes state to base64url', () => {
    const state = { foo: 'bar', baz: 'qux' };
    const encoded = encodeToolsetRedirectState(state);
    expect(typeof encoded).toBe('string');
    // Should be base64url (no +, /, =)
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
