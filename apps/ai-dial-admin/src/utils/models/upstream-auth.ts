import { DialUpstreamAuth, UpstreamAuthType } from '@/src/models/dial/model';

// Same token grammar Core validates a CUSTOM_HEADER name against (RFC 9110 field-name).
const HEADER_NAME_PATTERN = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/;

export const DEFAULT_UPSTREAM_AUTH: DialUpstreamAuth = { type: UpstreamAuthType.API_KEY };

/**
 * Core accepts `authType` as a bare string or as an object and serializes the object, but a config file
 * may still hold the string form. Everything past the read boundary works with the object only.
 */
export const normalizeUpstreamAuth = (auth?: DialUpstreamAuth | string | null): DialUpstreamAuth => {
  if (!auth) {
    return DEFAULT_UPSTREAM_AUTH;
  }

  if (typeof auth === 'string') {
    return { type: auth.toUpperCase() as UpstreamAuthType };
  }

  return auth.headerName ? { type: auth.type, headerName: auth.headerName } : { type: auth.type };
};

/**
 * Builds the auth object for a newly picked type, dropping `headerName` unless the type uses it —
 * Core rejects a `headerName` on any other type.
 */
export const createUpstreamAuth = (type: UpstreamAuthType, headerName?: string): DialUpstreamAuth =>
  type === UpstreamAuthType.CUSTOM_HEADER ? { type, headerName: headerName ?? '' } : { type };

export const isUpstreamAuthEqual = (a?: DialUpstreamAuth | string | null, b?: DialUpstreamAuth | string | null) => {
  const first = normalizeUpstreamAuth(a);
  const second = normalizeUpstreamAuth(b);

  return first.type === second.type && (first.headerName ?? '') === (second.headerName ?? '');
};

export const isValidUpstreamHeaderName = (headerName?: string) => !!headerName && HEADER_NAME_PATTERN.test(headerName);

/**
 * Core never returns a stored key, so a non-default auth that differs from the saved one has no key to
 * fall back on and the admin must supply one.
 */
export const isUpstreamAuthKeyRequired = (
  edited?: DialUpstreamAuth | string | null,
  original?: DialUpstreamAuth | string | null,
) => normalizeUpstreamAuth(edited).type !== UpstreamAuthType.API_KEY && !isUpstreamAuthEqual(edited, original);

