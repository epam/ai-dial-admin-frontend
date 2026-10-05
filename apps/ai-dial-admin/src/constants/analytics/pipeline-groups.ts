/**
 * The most groups the runner returns in one listing, and therefore the whole window the tab can show. The
 * listing has no cursor and always starts from the oldest activity, so a full window means the newest
 * groups are the ones missing.
 */
export const GROUPS_LIMIT = 500;

/** What the page asks for to decide whether the Groups tab is offered: one group is enough to know. */
export const GROUPS_PROBE_LIMIT = 1;
