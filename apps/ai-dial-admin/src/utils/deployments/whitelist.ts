export const mergeAllowedDomains = (existing: string[] | undefined, additions: string[]): string[] =>
  Array.from(new Set([...(existing ?? []), ...additions]));
