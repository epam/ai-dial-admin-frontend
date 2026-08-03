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
 * Core pairs each request upstream with its stored counterpart by matching `endpoint`, falling back to
 * positional matching only for entries carrying none — and its own contract warns that mixing the two
 * forms makes preservation unreliable. An upstream with no endpoint cannot route anyway.
 */
export const hasUpstreamsMissingEndpoint = (upstreams?: DialModelEndpoint[]): boolean =>
  !!upstreams?.some((upstream) => !upstream.endpoint);

/**
 * Endpoints whose secret cannot survive the write: Core looks the stored secret up by endpoint, so
 * renaming one while leaving its secrets blank silently drops the credential.
 *
 * Paired by index rather than by set membership, because the editor updates an upstream in place at a
 * fixed index (`UpstreamEndpoints.onUpdateEndPoint`). Set membership cannot tell a rename from a
 * remove-plus-add, so it flagged every newly added upstream — which never had a secret to lose.
 * Only indices that existed before the edit can lose anything.
 */
export const getUpstreamsLosingSecret = (
  original?: DialModelEndpoint[],
  edited?: DialModelEndpoint[],
): DialModelEndpoint[] => {
  if (!original?.length || !edited?.length) {
    return [];
  }

  return edited.filter((upstream, index) => {
    const previous = original[index];

    // Beyond the original length is an addition, which has no stored secret to lose.
    if (!previous || !upstream.endpoint || previous.endpoint === upstream.endpoint) {
      return false;
    }

    // Any stored secret this upstream had is unrecoverable once its endpoint changes, so re-entering
    // one of the two does not rescue the other.
    return UPSTREAM_SECRET_FIELDS.some((field) => isEmptyUpstreamSecret(upstream[field]));
  });
};
