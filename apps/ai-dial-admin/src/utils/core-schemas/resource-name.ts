import { CORE_UNENCODABLE_ID_CHARS } from './constants';

/**
 * Core stores both schema resource kinds under their JSON-Schema `$id`, whose `/` separators fail
 * `ENTITY_NAME_PATTERN` once the route boundary has decoded the path. Encoding here, before the
 * shared `encodeCorePath` applies its own per-segment encoding, puts the doubly-encoded form on the
 * wire so the name Core stores is the singly-encoded `$id`.
 */
export const toCoreSchemaResourceName = (id: string): string => encodeURIComponent(id);

export const fromCoreSchemaResourceName = (name: string): string => {
  try {
    return decodeURIComponent(name);
  } catch {
    // Not produced by `toCoreSchemaResourceName` — return it as-is rather than failing a whole list
    // read on one bad entry.
    return name;
  }
};

export const hasUnencodableSchemaIdChars = (id: string): boolean =>
  CORE_UNENCODABLE_ID_CHARS.some((char) => id.includes(char));
