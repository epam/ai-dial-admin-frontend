import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const KEYCLOAK_PREFIXES = ['AUTH_KEYCLOAK', 'AUTH_KEYCLOAK1'];
const KEYCLOAK_ENV = ['CLIENT_ID', 'SECRET', 'HOST'];
const KEYCLOAK_OPTIONAL_ENV = ['NAME', 'SCOPE'];

const stubKeycloak = (prefix: string, host: string) => {
  KEYCLOAK_ENV.forEach((suffix) => {
    vi.stubEnv(`${prefix}_${suffix}`, suffix === 'HOST' ? host : `${prefix}-${suffix}`);
  });
};

const loadProviders = async () => {
  vi.resetModules();
  return (await import('@/src/utils/auth/auth-providers')).authProviders;
};

describe('authProviders — Keycloak', () => {
  beforeEach(() => {
    KEYCLOAK_PREFIXES.forEach((prefix) => {
      [...KEYCLOAK_ENV, ...KEYCLOAK_OPTIONAL_ENV].forEach((suffix) => {
        vi.stubEnv(`${prefix}_${suffix}`, undefined);
      });
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  test('registers nothing when no Keycloak variables are set', async () => {
    const providers = await loadProviders();

    expect(providers.filter(({ id }) => id.startsWith('keycloak'))).toEqual([]);
  });

  test('registers the first provider under the keycloak id', async () => {
    stubKeycloak('AUTH_KEYCLOAK', 'https://kc.example.com/realms/a');

    const providers = await loadProviders();

    expect(providers.map(({ id }) => id)).toEqual(['keycloak']);
  });

  test('registers both providers under distinct ids with their own names', async () => {
    stubKeycloak('AUTH_KEYCLOAK', 'https://kc.example.com/realms/a');
    stubKeycloak('AUTH_KEYCLOAK1', 'https://kc.example.com/realms/b');
    vi.stubEnv('AUTH_KEYCLOAK_NAME', 'Realm A');
    vi.stubEnv('AUTH_KEYCLOAK1_NAME', 'Realm B');

    const providers = await loadProviders();

    expect(
      providers.map((provider) => [provider.id, (provider as { options?: { name?: string } }).options?.name]),
    ).toEqual([
      ['keycloak', 'Realm A'],
      ['keycloak1', 'Realm B'],
    ]);
  });

  test('registers only the second provider when just its variables are set', async () => {
    stubKeycloak('AUTH_KEYCLOAK1', 'https://kc.example.com/realms/b');

    const providers = await loadProviders();

    expect(providers.map(({ id }) => id)).toEqual(['keycloak1']);
  });

  test('skips a provider that is missing a required variable', async () => {
    vi.stubEnv('AUTH_KEYCLOAK1_CLIENT_ID', 'id');
    vi.stubEnv('AUTH_KEYCLOAK1_HOST', 'https://kc.example.com/realms/b');

    const providers = await loadProviders();

    expect(providers.filter(({ id }) => id.startsWith('keycloak'))).toEqual([]);
  });
});
