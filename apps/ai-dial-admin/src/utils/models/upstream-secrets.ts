import { DialModelEndpoint } from '@/src/models/dial/model';

/**
 * Upstream fields DIAL Core stores encrypted and never returns on read, so they render empty for every
 * previously saved upstream.
 */
export const UPSTREAM_SECRET_FIELDS = [
  'key',
  'secretExtraData',
] as const satisfies readonly (keyof DialModelEndpoint)[];

/**
 * Removes empty secrets so DIAL Core preserves the values it already holds.
 *
 * Core restores an omitted or null secret from the stored resource, but treats a literal string —
 * including `''` — as a new value to encrypt. Sending an empty string therefore replaces a real
 * credential with an empty one, and the save succeeds, so the model simply stops authenticating. The
 * shared upstream editor emits `''` on any touch-then-clear, which is harmless on the entity path
 * (the admin BE round-trips the value) and destructive here.
 */
/**
 * Shape-aware, because `secretExtraData` is `string | object`: the extra-data editor's JSON mode emits
 * a parsed value, so `{}` and `[]` arrive as truthy-but-empty. A plain truthiness test would let those
 * through and Core would re-encrypt them over the stored credential.
 */
const isEmptyUpstreamSecret = (value: unknown): boolean => {
  if (value == null || value === '') {
    return true;
  }

  if (typeof value === 'object') {
    return Object.keys(value as object).length === 0;
  }

  return false;
};

export const stripEmptyUpstreamSecrets = (upstreams?: DialModelEndpoint[]): DialModelEndpoint[] | undefined => {
  if (!upstreams) {
    return upstreams;
  }

  return upstreams.map((upstream) => {
    const stripped = { ...upstream };

    UPSTREAM_SECRET_FIELDS.forEach((field) => {
      if (isEmptyUpstreamSecret(stripped[field])) {
        delete stripped[field];
      }
    });

    return stripped;
  });
};

/**
 * The saved upstream an edited one corresponds to, mirroring how Core restores an omitted secret:
 * by endpoint first, then by index.
 *
 * Index alone breaks once an upstream is deleted and the rest shift. The index fallback is a rename in
 * place (the editor updates an upstream at a fixed index — `UpstreamEndpoints.onUpdateEndPoint`), so it
 * applies only while the saved upstream at that index is not itself still present under its own
 * endpoint. Beyond the original length is an addition, which has no stored secret to lose.
 */
export const findOriginalUpstream = (
  original: DialModelEndpoint[] | undefined,
  edited: DialModelEndpoint[] | undefined,
  index: number,
): DialModelEndpoint | undefined => {
  const endpoint = edited?.[index]?.endpoint;
  const matched = endpoint ? original?.find((upstream) => upstream.endpoint === endpoint) : undefined;

  if (matched) {
    return matched;
  }

  const atIndex = original?.[index];

  return atIndex && !edited?.some((upstream) => upstream.endpoint && upstream.endpoint === atIndex.endpoint)
    ? atIndex
    : undefined;
};

/**
 * Endpoints whose secret cannot survive the write: Core looks the stored secret up by endpoint, so
 * renaming one while leaving its secrets blank silently drops the credential.
 *
 * Set membership alone cannot tell a rename from a remove-plus-add, so it flagged every newly added
 * upstream — which never had a secret to lose; see `findOriginalUpstream` for the pairing.
 */
export const getUpstreamsLosingSecret = (
  original?: DialModelEndpoint[],
  edited?: DialModelEndpoint[],
): DialModelEndpoint[] => {
  if (!original?.length || !edited?.length) {
    return [];
  }

  return edited.filter((upstream, index) => {
    const previous = findOriginalUpstream(original, edited, index);

    if (!previous || !upstream.endpoint || previous.endpoint === upstream.endpoint) {
      return false;
    }

    // Any stored secret this upstream had is unrecoverable once its endpoint changes, so re-entering
    // one of the two does not rescue the other.
    return UPSTREAM_SECRET_FIELDS.some((field) => isEmptyUpstreamSecret(upstream[field]));
  });
};
