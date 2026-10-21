import { BreakdownRow, BreakdownTab, RouteKind } from '@/src/components/Analytics/Usage/models';

/**
 * Which kind of route an owner names. A global route's owner is built from its path, slash first; a
 * deployment is named by an id or a bucket path and never starts with one — so the owner alone
 * answers, and the kind costs no group key of its own.
 */
export const getRouteKind = (owner: string): RouteKind =>
  owner.startsWith('/') ? RouteKind.Global : RouteKind.Application;

/** The owner a row of a kind-stating tab belongs to: its own value on `Owners`, its lead qualifier on `Paths`. */
export const getRowRouteOwner = (tab: BreakdownTab, row: BreakdownRow): string | null => {
  if (tab === BreakdownTab.Owners) {
    return row.isFallbackLabel ? null : row.label;
  }

  if (tab === BreakdownTab.Paths) {
    return row.qualifiers?.[0] || null;
  }

  return null;
};
