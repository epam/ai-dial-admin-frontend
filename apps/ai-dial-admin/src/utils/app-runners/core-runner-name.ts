import { CORE_UNENCODABLE_ID_CHARS } from './constants';

/**
 * An app-runner's `$id` is a URI, and its `/` separators fail Core's `ENTITY_NAME_PATTERN` once the
 * route boundary has decoded the path. Encoding here, before the shared `encodeCorePath` applies its
 * own per-segment encoding, puts the doubly-encoded form on the wire so the name Core stores is the
 * singly-encoded `$id`.
 */
export const toCoreRunnerName = (id: string): string => encodeURIComponent(id);

/** Reverses `toCoreRunnerName` after the shared `decodeCorePath` has removed the outer layer. */
export const fromCoreRunnerName = (name: string): string => {
  try {
    return decodeURIComponent(name);
  } catch {
    // A malformed escape sequence means the name was not produced by toCoreRunnerName — return it
    // as-is rather than failing a whole list read on one bad entry.
    return name;
  }
};

export const hasUnencodableRunnerIdChars = (id: string): boolean =>
  CORE_UNENCODABLE_ID_CHARS.some((char) => id.includes(char));
