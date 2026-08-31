/**
 * For members that reach the console as parsed JSON rather than through a typed control — the entity JSON
 * editors let an operator put anything that parses on a draft. `?.trim()` guards a missing value but not a
 * value of the wrong type, and these members are read while the page renders, where a `TypeError` reaches
 * the error boundary and blanks the page.
 */
export const trimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
