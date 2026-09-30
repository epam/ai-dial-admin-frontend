import { NextAuthToken } from '@/src/models/auth';
import { Client, custom, Issuer } from 'openid-client';
import type * as jose from 'jose';
import { OAuthConfig, Provider } from 'next-auth/providers';

import { isAccessTokenExpired } from './token-expiry';

// Refresh state of one sign-in: its newest refreshed token and the refresh currently running, if any.
interface SessionRefreshState {
  latest?: NextAuthToken;
  inFlight?: Promise<NextAuthToken>;
}

// Entries whose newest access token expired this long ago belong to abandoned sessions.
const REFRESH_STATE_TTL_MS = 24 * 60 * 60 * 1000;

interface OidcProviderConfig {
  authorization?: string | { url?: string };
  callbackUrl?: string;
  client?: Record<string, unknown>;
  clientId?: string;
  clientSecret?: string;
  httpOptions?: Parameters<typeof custom.setHttpOptionsDefaults>[0];
  issuer?: string;
  jwks?: { keys: jose.JWK[] };
  jwks_endpoint?: string;
  token?: string | { url?: string };
  userinfo?: string | { url?: string };
  wellKnown?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalObj = globalThis as unknown as any;

const getEndpointUrl = (endpoint?: string | { url?: string }) => {
  if (typeof endpoint === 'string') {
    return new URL(endpoint).origin + new URL(endpoint).pathname;
  }

  return endpoint?.url;
};

const getProviderConfig = (provider: Provider): OidcProviderConfig => {
  const { options, ...providerDefaults } = provider as OAuthConfig<Record<string, unknown>>;
  const providerOptions = options as OidcProviderConfig | undefined;

  return {
    ...providerDefaults,
    ...providerOptions,
    authorization: providerOptions?.authorization ?? providerDefaults.authorization,
    token:
      typeof providerOptions?.token === 'object' && 'url' in providerOptions.token
        ? providerOptions.token
        : providerDefaults.token,
    userinfo: providerOptions?.userinfo ?? providerDefaults.userinfo,
  };
};

const getRefreshStates = (): Map<string, SessionRefreshState> => {
  globalObj._refreshStates = globalObj._refreshStates || new Map<string, SessionRefreshState>();

  return globalObj._refreshStates;
};

// Sessions signed in before `sessionKey` existed fall back to their refresh token.
const getSessionKey = (token: NextAuthToken): string | undefined => {
  if (token.sessionKey) {
    return token.sessionKey;
  }

  return typeof token.refreshToken === 'string' ? token.refreshToken : token.refreshToken?.refresh_token;
};

const getNewerToken = (token: NextAuthToken, latest?: NextAuthToken): NextAuthToken => {
  if (!latest) {
    return token;
  }

  return (latest.accessTokenExpires ?? 0) > (token.accessTokenExpires ?? 0) ? latest : token;
};

const evictAbandonedStates = (refreshStates: Map<string, SessionRefreshState>, now = Date.now()) => {
  refreshStates.forEach((state, key) => {
    const expires = state.latest?.accessTokenExpires;
    if (!state.inFlight && typeof expires === 'number' && expires < now - REFRESH_STATE_TTL_MS) {
      refreshStates.delete(key);
    }
  });
};

export class NextClient {
  public static setClient(clientLocal: Client | null, provider: { id: string }) {
    globalObj._client = globalObj._client || {};

    globalObj._client[provider.id] = clientLocal;
  }

  public static getClient(providerId: string): Client | null {
    globalObj._client = globalObj._client || {};

    return globalObj._client[providerId] || null;
  }

  /**
   * Runs at most one refresh per sign-in at a time. Concurrent callers share the running refresh, and a
   * caller presenting a token older than one this process already refreshed gets the newer token without
   * contacting the IdP. Failures are returned but never cached, so the next call refreshes again.
   */
  public static async refreshOnce(
    token: NextAuthToken,
    refresh: (base: NextAuthToken) => Promise<NextAuthToken>,
  ): Promise<NextAuthToken> {
    const key = getSessionKey(token);
    if (!key) {
      return refresh(token);
    }

    const refreshStates = getRefreshStates();
    const state = refreshStates.get(key) ?? {};
    const base = getNewerToken(token, state.latest);
    if (!isAccessTokenExpired(base)) {
      return base;
    }
    if (state.inFlight) {
      return state.inFlight;
    }

    const runRefresh = async () => {
      try {
        const refreshed = await refresh(base);
        if (refreshed.error == null) {
          evictAbandonedStates(refreshStates);
          refreshStates.set(key, { ...refreshStates.get(key), latest: refreshed });
        }
        return refreshed;
      } finally {
        const current = refreshStates.get(key);
        if (current?.inFlight === inFlight) {
          delete current.inFlight;
        }
      }
    };
    const inFlight = runRefresh();
    refreshStates.set(key, { ...state, inFlight });

    return inFlight;
  }

  public static clearRefreshState(token: NextAuthToken | null | undefined): void {
    const key = token ? getSessionKey(token) : undefined;
    if (key) {
      getRefreshStates().delete(key);
    }
  }

  public static async getOrCreateClient(providerId: string): Promise<Client | null> {
    const cachedClient = NextClient.getClient(providerId);
    if (cachedClient) {
      return cachedClient;
    }

    const { authProviders } = await import('./auth-providers');
    const provider = authProviders.find(({ id }) => id === providerId);
    if (!provider) {
      return null;
    }

    const providerConfig = getProviderConfig(provider);
    if (
      !providerConfig.clientId ||
      (!providerConfig.wellKnown && (!providerConfig.issuer || !getEndpointUrl(providerConfig.token)))
    ) {
      return null;
    }

    if (providerConfig.httpOptions) {
      custom.setHttpOptionsDefaults(providerConfig.httpOptions);
    }

    const issuer = providerConfig.wellKnown
      ? await Issuer.discover(providerConfig.wellKnown)
      : new Issuer({
          issuer: providerConfig.issuer as string,
          authorization_endpoint: getEndpointUrl(providerConfig.authorization),
          token_endpoint: getEndpointUrl(providerConfig.token) as string,
          userinfo_endpoint: getEndpointUrl(providerConfig.userinfo),
          jwks_uri: providerConfig.jwks_endpoint,
        });
    const client = new issuer.Client(
      {
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        redirect_uris: providerConfig.callbackUrl ? [providerConfig.callbackUrl] : undefined,
        ...providerConfig.client,
      },
      providerConfig.jwks,
    );

    client[custom.clock_tolerance] = 10;
    NextClient.setClient(client, provider);

    return client;
  }
}
