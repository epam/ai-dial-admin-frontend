import { ToolsetAuthCredentialLevel, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/toolset';
import { describe, expect, test } from 'vitest';
import {
  encodeToolsetRedirectState,
  getToolsetBasicBody,
  getToolsetSignInBody,
  isFullLoggedInToToolset,
  isLoggedInToToolset,
} from '../toolset-auth';

describe('toolset-auth utils', () => {
  test('getToolsetSignInBody returns OAUTH body with code and redirectUri', () => {
    const toolset = { authSettings: { authenticationType: ToolsetAuthType.OAUTH } } as any;
    const result = getToolsetSignInBody(
      toolset,
      ToolsetAuthCredentialLevel.APP,
      void 0,
      'authcode',
      'https://redirect.example.com/callback',
    );
    expect(result).toMatchObject({
      credentialsLevel: ToolsetAuthCredentialLevel.APP,
      authenticationType: ToolsetAuthType.OAUTH,
      code: 'authcode',
      redirectUri: 'https://redirect.example.com/callback',
    });
  });

  test('getToolsetSignInBody returns APIKEY body with apiKeyHeader', () => {
    const toolset = {
      path: 'public/toolset1',
      authSettings: { authenticationType: ToolsetAuthType.API_KEY, apiKeyHeader: 'X-API-KEY' },
    } as any;
    const result = getToolsetSignInBody(toolset, ToolsetAuthCredentialLevel.USER, 'value');
    expect(result).toMatchObject({
      url: 'toolsets/public/toolset1',
      credentialsLevel: ToolsetAuthCredentialLevel.USER,
      authenticationType: ToolsetAuthType.API_KEY,
      apiKey: 'value',
    });
  });

  test('getToolsetBasicBody returns basic body', () => {
    const toolset = { path: 'public/toolset1', authSettings: { authenticationType: ToolsetAuthType.API_KEY } } as any;
    const result = getToolsetBasicBody(toolset, ToolsetAuthCredentialLevel.USER);
    expect(result).toMatchObject({
      url: 'toolsets/public/toolset1',
      credentialsLevel: ToolsetAuthCredentialLevel.USER,
      authenticationType: ToolsetAuthType.API_KEY,
    });
  });

  test('encodeToolsetRedirectState encodes state to base64url', () => {
    const state = { foo: 'bar', baz: 'qux' };
    const encoded = encodeToolsetRedirectState(state);
    expect(typeof encoded).toBe('string');
    // Should be base64url (no +, /, =)
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe('isLoggedInToToolset', () => {
  test('returns true if userLevelAuthStatus is SIGNED_IN', () => {
    const toolset = {
      authSettings: {
        userLevelAuthStatus: ToolsetAuthStatus.SIGNED_IN,
        globalAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
      },
    } as any;
    expect(isLoggedInToToolset(toolset)).toBe(true);
  });

  test('returns true if globalAuthStatus is SIGNED_IN', () => {
    const toolset = {
      authSettings: {
        userLevelAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
        globalAuthStatus: ToolsetAuthStatus.SIGNED_IN,
      },
    } as any;
    expect(isLoggedInToToolset(toolset)).toBe(true);
  });

  test('returns false if both are SIGNED_OUT', () => {
    const toolset = {
      authSettings: {
        userLevelAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
        globalAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
      },
    } as any;
    expect(isLoggedInToToolset(toolset)).toBe(false);
  });

  test('returns false if authSettings is missing', () => {
    const toolset = {} as any;
    expect(isLoggedInToToolset(toolset)).toBe(false);
  });
});

describe('isFullLoggedInToToolset', () => {
  test('returns true if both user and global are SIGNED_IN', () => {
    const toolset = {
      authSettings: {
        userLevelAuthStatus: ToolsetAuthStatus.SIGNED_IN,
        globalAuthStatus: ToolsetAuthStatus.SIGNED_IN,
      },
    } as any;
    expect(isFullLoggedInToToolset(toolset)).toBe(true);
  });

  test('returns false if only userLevelAuthStatus is SIGNED_IN', () => {
    const toolset = {
      authSettings: {
        userLevelAuthStatus: ToolsetAuthStatus.SIGNED_IN,
        globalAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
      },
    } as any;
    expect(isFullLoggedInToToolset(toolset)).toBe(false);
  });

  test('returns false if only globalAuthStatus is SIGNED_IN', () => {
    const toolset = {
      authSettings: {
        userLevelAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
        globalAuthStatus: ToolsetAuthStatus.SIGNED_IN,
      },
    } as any;
    expect(isFullLoggedInToToolset(toolset)).toBe(false);
  });

  test('returns false if both are SIGNED_OUT', () => {
    const toolset = {
      authSettings: {
        userLevelAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
        globalAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
      },
    } as any;
    expect(isFullLoggedInToToolset(toolset)).toBe(false);
  });

  test('returns false if authSettings is missing', () => {
    const toolset = {} as any;
    expect(isFullLoggedInToToolset(toolset)).toBe(false);
  });
});
