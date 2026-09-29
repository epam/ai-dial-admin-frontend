import { Token } from '@/src/models/auth';
import { Client, custom, Issuer } from 'openid-client';
import type * as jose from 'jose';
import { OAuthConfig, Provider } from 'next-auth/providers';

export interface RefreshToken {
  isRefreshing: boolean;
  token: Token;
}

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

export class NextClient {
  public static setClient(clientLocal: Client | null, provider: { id: string }) {
    globalObj._client = globalObj._client || {};

    globalObj._client[provider.id] = clientLocal;
  }

  public static getClient(providerId: string): Client | null {
    globalObj._client = globalObj._client || {};

    return globalObj._client[providerId] || null;
  }

  public static getRefreshToken(userId: string): RefreshToken | undefined {
    globalObj._refreshTokenMap = globalObj._refreshTokenMap || {};

    return globalObj._refreshTokenMap[userId];
  }

  public static setIsRefreshTokenStart(userId: string, refreshToken: RefreshToken): void {
    globalObj._refreshTokenMap[userId] = refreshToken;
  }

  public static delay(): Promise<undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, 50);
    });
  }

  public static clearRefreshToken(userId: string): void {
    if (globalObj._refreshTokenMap && globalObj._refreshTokenMap[userId]) {
      delete globalObj._refreshTokenMap[userId];
    }
  }

  public static clearAllRefreshTokens(): void {
    globalObj._refreshTokenMap = {};
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
