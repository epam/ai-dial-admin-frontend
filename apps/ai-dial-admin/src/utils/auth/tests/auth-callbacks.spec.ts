import { describe, test, expect, vi } from 'vitest';
import { safeDecodeJwt, getUser, callbacks, tokenConfig } from '../auth-callbacks';

describe('auth-callbacks', () => {
  test('safeDecodeJwt returns decoded payload for valid JWT', () => {
    const validJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = safeDecodeJwt(validJwt);
    expect(result).toHaveProperty('sub', '1234567890');
    expect(result).toHaveProperty('name', 'John Doe');
  });

  test('safeDecodeJwt returns empty object for invalid JWT', () => {
    const result = safeDecodeJwt('invalid.jwt');
    expect(result).toEqual({});
  });

  test('getUser returns isAdmin true if roles match adminRoleNames', () => {
    process.env.DIAL_ROLES_FIELD = 'roles';
    process.env.ADMIN_ROLE_NAMES = 'admin,superuser';
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJhZG1pbiJdfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = getUser(jwt, 'provider');
    expect(result.isAdmin).toBe(true);
  });

  test('getUser returns isAdmin false if roles do not match adminRoleNames', () => {
    process.env.DIAL_ROLES_FIELD = 'roles';
    process.env.ADMIN_ROLE_NAMES = 'admin,superuser';
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJ1c2VyIl19.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = getUser(jwt, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('getUser returns isAdmin false if no roles', () => {
    process.env.DIAL_ROLES_FIELD = 'roles';
    process.env.ADMIN_ROLE_NAMES = 'admin,superuser';
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = getUser(jwt, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('getUser returns isAdmin false if jwt is empty', () => {
    process.env.AUTH_PROVIDER_DIAL_ROLES_FIELD = 'roles';
    process.env.AUTH_PROVIDER_ADMIN_ROLE_NAMES = 'admin,superuser';
    const result = getUser(void 0, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('getUser returns isAdmin false if roles do not match adminRoleNames', () => {
    delete process.env.AUTH_PROVIDER_DIAL_ROLES_FIELD;
    delete process.env.AUTH_PROVIDER_ADMIN_ROLE_NAMES;
    const result = getUser(void 0, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('signIn callback returns false if no access_token', async () => {
    const result = await callbacks.signIn!({ account: {} } as any);
    expect(result).toBe(false);
  });

  test('signIn callback returns true if access_token exists', async () => {
    const result = await callbacks.signIn!({ account: { access_token: 'token' } } as any);
    expect(result).toBe(true);
  });

  test('session callback sets error if token.error exists', async () => {
    const session = { user: {} };
    const token = { error: 'err', user: {} };
    const result = (await callbacks.session!({ session, token } as any)) as any;
    expect(result.error).toBe('err');
  });

  test('session callback sets providerId if session.user exists', async () => {
    const session = { user: {} };
    const token = { providerId: 'prov', user: {} };
    const result = (await callbacks.session!({ session, token } as any)) as any;
    expect(result.providerId).toBe('prov');
  });

});
