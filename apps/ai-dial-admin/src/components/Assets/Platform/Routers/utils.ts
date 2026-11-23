import { MAX_DECISIONS, MIN_DECISIONS } from '@/src/components/Assets/Platform/Routers/constants';
import { InterfaceMode } from '@/src/models/dial/interfaces';
import { DialRouterResource } from '@/src/models/dial/resource';
import { RouterDecision, RouterMode } from '@/src/models/dial/router';

/** Parses a numeric input; `undefined` for an empty field, `NaN` for text that is not a number. */
export const parseDecisionNumber = (value?: string): number | undefined => {
  const trimmed = value?.trim();

  return trimmed ? Number(trimmed) : undefined;
};

/** `timeoutMs`: absent (Core's default applies) or a positive whole number. */
export const isValidTimeoutMs = (value?: number): boolean => value == null || (Number.isInteger(value) && value > 0);

/** `maxDecisions`: absent (Core's default applies) or a whole number from 1 to 10. */
export const isValidMaxDecisions = (value?: number): boolean =>
  value == null || (Number.isInteger(value) && value >= MIN_DECISIONS && value <= MAX_DECISIONS);

/** Drops a `decision` object left holding nothing, so an untouched section is not written as `{}`. */
export const compactDecision = (decision: RouterDecision): RouterDecision | undefined => {
  const entries = Object.entries(decision).filter(([, value]) => value !== undefined);

  return entries.length ? (Object.fromEntries(entries) as RouterDecision) : undefined;
};

/** Absent `mode` is `proxy` on Core, so a stored router with none reads as proxy. */
export const getRouterMode = (router: Pick<DialRouterResource, 'mode'>): RouterMode => router.mode ?? RouterMode.Proxy;

/**
 * Applies a mode change. Proxy is written as an absent `mode` (what Core's default means) and drops the
 * whole `decision` object, which Core rejects on a proxy router. Decision drops every translated
 * interface's `translator`, which Core rejects there; the row falls back to passthrough.
 */
export const applyRouterMode = (router: DialRouterResource, mode: RouterMode): DialRouterResource => {
  if (mode === RouterMode.Proxy) {
    return { ...router, mode: undefined, decision: undefined };
  }

  const interfaces = router.interfaces
    ? Object.fromEntries(
        Object.entries(router.interfaces).map(([type, value]) => [
          type,
          value.mode === InterfaceMode.Translator || value.translator
            ? { ...value, mode: undefined, translator: undefined }
            : value,
        ]),
      )
    : undefined;

  return { ...router, mode, interfaces };
};
