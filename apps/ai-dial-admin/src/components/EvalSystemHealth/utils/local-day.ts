/** The first instant of the local calendar day `now` falls in, in epoch milliseconds. */
export const startOfLocalDay = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

/** Milliseconds from `now` to the first instant of the next local calendar day. */
export const msUntilNextLocalDay = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
