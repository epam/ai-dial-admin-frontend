/**
 * A deployment display field as DIAL Core accepts it: a plain string, or a BCP-47
 * `locale -> value` map (Core's `LocalizedValue`). The console authors only the string form; a map
 * that arrived from elsewhere is rendered read-only and carried through a save untouched.
 */
export type LocalizedText = string | Record<string, string>;
