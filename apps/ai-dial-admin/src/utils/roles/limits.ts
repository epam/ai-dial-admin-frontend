import { DialCoreRoleLimits } from '@/src/models/dial/role-limits';

/**
 * DIAL Core's `Limit`/`CostLimit` classes default every `long`/`BigDecimal` token to
 * `Long.MAX_VALUE` (9223372036854775807) to mean "unlimited" — a value with 19 significant digits,
 * far past `Number.MAX_SAFE_INTEGER` (2^53-1, 16 digits), so a plain `JSON.parse` silently rounds it
 * to the nearest representable double (visibly `9223372036854776000` in a browser's console).
 *
 * Rather than preserving that value's exact digits through the read/write round-trip, or stringifying
 * it, this treats any token whose magnitude overflows the safe integer range as simply **absent** —
 * Core's own field default already means "unlimited" once a token is missing from the JSON. A role's
 * `costLimit`/`limits` write is always a full replace, never a merge with the stored blob (`Role` has
 * no encrypted fields, so `ConfigResourceController.prepareWrite`'s update arm skips
 * `mergePreservingOmittedSecrets` entirely and deserializes the request body verbatim) — so omitting
 * a token on write is exactly equivalent to explicitly sending `9223372036854775807`, with no risk of
 * a stale value surviving from whatever was stored before. The exact digits are never needed: the UI
 * only ever needs to know "is this token unlimited", never what the sentinel's value actually is.
 *
 * Decimal tokens (e.g. a `BigDecimal` cost limit of `1.5`) are kept — `CostLimit` uses `BigDecimal`
 * on Core's side, and a finite JS double within the safe integer magnitude range is a faithful
 * round-trip for any realistic cost-limit value. Only the overflow sentinel is dropped, not
 * non-integer values in general.
 *
 * Every token that survives is kept as a plain `number` — `DialCoreRoleLimits`'s declared type — not
 * a string: Core's `Limit`/`CostLimit` fields have no `@JsonFormat(shape=STRING)`, so a number is
 * what the wire actually carries and what the UI should show.
 */
const isSafeNumber = (value: number): boolean => Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;

const isSafeNumericToken = (value: unknown): value is number | string =>
  (typeof value === 'number' && isSafeNumber(value)) || (typeof value === 'string' && isSafeNumber(Number(value)));

/**
 * Normalizes one `Limit`/`CostLimit`-shaped object: a token whose magnitude overflows the safe
 * integer range is dropped rather than kept as a lossily-rounded number, so no consumer can mistake
 * it for a real, finite value. Decimal values within range are kept.
 */
export const normalizeRoleLimits = (limits?: Record<string, unknown> | null): DialCoreRoleLimits | undefined => {
  if (!limits) {
    return undefined;
  }

  const normalized: DialCoreRoleLimits = {};
  Object.entries(limits).forEach(([key, value]) => {
    if (value == null || key === 'enabled') {
      return;
    }
    if (isSafeNumericToken(value)) {
      (normalized as Record<string, number>)[key] = Number(value);
    }
    // else: token overflows a safe integer (e.g. the Long.MAX_VALUE "unlimited" sentinel) — drop
    // it. Core's own field default already means "unlimited" once it's missing from the JSON.
  });
  return normalized;
};

/**
 * The write-side counterpart: every token that reaches here is already known to be within
 * `Number.isSafeInteger` range — `normalizeRoleLimits` dropped anything that wasn't — so this is
 * just a null-filtering passthrough, not a conversion.
 */
export const toWireRoleLimits = (limits?: DialCoreRoleLimits | null): Record<string, unknown> | undefined => {
  if (!limits) {
    return undefined;
  }

  const wire: Record<string, unknown> = {};
  Object.entries(limits).forEach(([key, value]) => {
    if (value != null) {
      wire[key] = value;
    }
  });
  return wire;
};
