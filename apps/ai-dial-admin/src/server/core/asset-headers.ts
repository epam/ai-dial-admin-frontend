import { DEFAULT_ETAG, IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';

/**
 * Conditional-header helpers matching the backend's `HeaderUtils`. An etag of
 * `null`/`undefined` or the `*` sentinel means "no precondition" and produces no
 * header at all — a real etag produces a real conditional header.
 */
export const createIfMatchHeaders = (etag?: string | null): HeadersInit => {
  if (!etag || etag === DEFAULT_ETAG) {
    return {};
  }
  return { [IF_MATCH]: etag };
};

export const createIfNoneMatchHeaders = (etag?: string | null): HeadersInit => {
  if (!etag || etag === DEFAULT_ETAG) {
    return {};
  }
  return { [IF_NONE_MATCH]: etag };
};

/**
 * Headers for a create/put call. Mirrors the backend's `createHeadersForCreate`:
 * unless `allowOverride` is set, a create must not clobber an existing resource
 * (`If-None-Match: *`); an explicit override or update instead becomes a normal
 * `If-Match` precondition (or none, if no etag is supplied).
 */
export const createHeadersForCreate = (allowOverride: boolean, etag?: string | null): HeadersInit => {
  if (!allowOverride) {
    return { [IF_NONE_MATCH]: DEFAULT_ETAG };
  }
  return createIfMatchHeaders(etag);
};
